"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, Trash2 } from "lucide-react";

import { EditorDialogShell } from "@/components/editor/editor-dialog-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Collaborator {
  email: string;
  name: string | null;
  imageUrl: string | null;
}

interface ShareDialogProps {
  open: boolean;
  projectId: string;
  isOwner: boolean;
  onClose: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ShareDialog({
  open,
  projectId,
  isOwner,
  onClose,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [projectUrl, setProjectUrl] = useState("");

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCollaborators = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`);
      if (!response.ok) {
        setCollaborators([]);
        return;
      }
      const data = (await response.json()) as {
        collaborators: Collaborator[];
      };
      setCollaborators(data.collaborators);
    } catch {
      setCollaborators([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setInviteError(null);
    setCopied(false);
    setProjectUrl(`${window.location.origin}/editor/${projectId}`);
    loadCollaborators();
  }, [open, projectId, loadCollaborators]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard may be unavailable in insecure contexts
    }
  };

  const trimmedEmail = email.trim().toLowerCase();
  const canSubmitInvite =
    isOwner && EMAIL_REGEX.test(trimmedEmail) && !isInviting;

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitInvite) return;
    setIsInviting(true);
    setInviteError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          setInviteError("That person is already a collaborator.");
        } else if (response.status === 400) {
          setInviteError("Please enter a valid email.");
        } else {
          setInviteError("Could not invite this person.");
        }
        return;
      }
      const data = (await response.json()) as { collaborator: Collaborator };
      setCollaborators((prev) => [...prev, data.collaborator]);
      setEmail("");
    } catch {
      setInviteError("Could not invite this person.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (target: string) => {
    if (!isOwner) return;
    const previous = collaborators;
    setCollaborators(previous.filter((c) => c.email !== target));
    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators?email=${encodeURIComponent(target)}`,
        { method: "DELETE" },
      );
      if (!response.ok) setCollaborators(previous);
    } catch {
      setCollaborators(previous);
    }
  };

  return (
    <EditorDialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Share project"
      description={
        isOwner
          ? "Invite collaborators by email or share the project link."
          : "View who has access to this project."
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-copy-secondary">
            Project link
          </span>
          <div className="flex items-center gap-2">
            <Input
              value={projectUrl}
              readOnly
              className="flex-1 font-mono text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={handleCopy}
              className="shrink-0 text-copy-secondary hover:bg-bg-subtle hover:text-copy-primary"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {isOwner ? (
          <form onSubmit={handleInvite} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-copy-secondary">
              Invite by email
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (inviteError) setInviteError(null);
                }}
                placeholder="teammate@example.com"
                disabled={isInviting}
                className="flex-1"
              />
              <Button type="submit" disabled={!canSubmitInvite}>
                Invite
              </Button>
            </div>
            {inviteError ? (
              <p className="text-xs text-destructive">{inviteError}</p>
            ) : null}
          </form>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-copy-secondary">
            Collaborators
          </span>
          {isLoading ? (
            <div className="flex items-center justify-center rounded-xl border border-surface-border bg-bg-subtle/40 py-6 text-copy-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : collaborators.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-border bg-bg-subtle/40 px-4 py-3 text-sm text-copy-muted">
              No collaborators yet.
            </div>
          ) : (
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {collaborators.map((collaborator) => (
                <CollaboratorRow
                  key={collaborator.email}
                  collaborator={collaborator}
                  canRemove={isOwner}
                  onRemove={handleRemove}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </EditorDialogShell>
  );
}

interface CollaboratorRowProps {
  collaborator: Collaborator;
  canRemove: boolean;
  onRemove: (email: string) => void;
}

function CollaboratorRow({
  collaborator,
  canRemove,
  onRemove,
}: CollaboratorRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-bg-subtle">
      <CollaboratorAvatar collaborator={collaborator} />
      <div className="min-w-0 flex-1">
        {collaborator.name ? (
          <>
            <p className="truncate text-sm text-copy-primary">
              {collaborator.name}
            </p>
            <p className="truncate text-xs text-copy-muted">
              {collaborator.email}
            </p>
          </>
        ) : (
          <p className="truncate text-sm text-copy-primary">
            {collaborator.email}
          </p>
        )}
      </div>
      {canRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Remove ${collaborator.email}`}
          onClick={() => onRemove(collaborator.email)}
          className="h-7 w-7 text-copy-secondary hover:bg-bg-elevated hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </li>
  );
}

function CollaboratorAvatar({ collaborator }: { collaborator: Collaborator }) {
  const initials = (collaborator.name ?? collaborator.email)
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

  if (collaborator.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={collaborator.imageUrl}
        alt=""
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-subtle text-xs font-medium text-copy-secondary">
      {initials || "?"}
    </div>
  );
}
