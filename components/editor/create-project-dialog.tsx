"use client";

import { FormEvent } from "react";

import { EditorDialogShell } from "@/components/editor/editor-dialog-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slug";

interface CreateProjectDialogProps {
  open: boolean;
  name: string;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function CreateProjectDialog({
  open,
  name,
  isSubmitting,
  onNameChange,
  onSubmit,
  onClose,
}: CreateProjectDialogProps) {
  const slugPreview = slugify(name);
  const canSubmit = slugPreview.length > 0 && !isSubmitting;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <EditorDialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Create a new project"
      description="Give your architecture workspace a name. We'll generate the URL slug from it."
      footerActions={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-project-form"
            disabled={!canSubmit}
          >
            Create project
          </Button>
        </>
      }
    >
      <form
        id="create-project-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-copy-secondary">
            Project name
          </span>
          <Input
            autoFocus
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Payments Service"
            disabled={isSubmitting}
          />
        </label>
        <div className="rounded-xl border border-surface-border bg-bg-subtle/40 px-3 py-2 text-xs text-copy-muted">
          Slug preview:{" "}
          <span className="font-mono text-copy-secondary">
            {slugPreview || "—"}
          </span>
        </div>
      </form>
    </EditorDialogShell>
  );
}
