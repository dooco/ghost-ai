"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { SpecPreviewModal } from "@/components/editor/spec-preview-modal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpecListItem {
  id: string;
  createdAt: string;
  filename: string;
}

interface SpecsTabProps {
  projectId: string;
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SpecsTab({ projectId }: SpecsTabProps) {
  const [specs, setSpecs] = useState<SpecListItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SpecListItem | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch(`/api/projects/${projectId}/specs`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load specs (status ${response.status})`);
        }
        return response.json() as Promise<{ specs: SpecListItem[] }>;
      })
      .then((body) => {
        setSpecs(body.specs ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load specs");
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [projectId]);

  const handleOpen = useCallback((spec: SpecListItem) => {
    setSelected(spec);
  }, []);

  const handleClose = useCallback(() => {
    setSelected(null);
  }, []);

  return (
    <>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="flex flex-col gap-2 pr-1">
          {isLoading ? (
            <li className="flex items-center gap-2 px-1 text-xs text-copy-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading specs…
            </li>
          ) : error ? (
            <li role="alert" className="px-1 text-xs text-red-400">
              {error}
            </li>
          ) : specs && specs.length === 0 ? (
            <li className="px-1 text-xs text-copy-muted">
              No specs yet. Generate one to get started.
            </li>
          ) : (
            specs?.map((spec) => (
              <li key={spec.id}>
                <button
                  type="button"
                  onClick={() => handleOpen(spec)}
                  className="flex w-full items-start gap-3 rounded-xl border border-surface-border bg-bg-elevated p-3 text-left transition-colors hover:border-accent-ai/40 hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-ai"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-ai/15 text-accent-ai-text">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-sm font-medium text-copy-primary">
                      {spec.filename}
                    </p>
                    <p className="text-[11px] text-copy-muted">
                      {formatCreatedAt(spec.createdAt)}
                    </p>
                  </div>
                  <Button
                    asChild
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs text-copy-muted hover:bg-bg-subtle hover:text-copy-primary"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <a
                      href={`/api/projects/${projectId}/specs/${spec.id}/download`}
                      download={spec.filename}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Download ${spec.filename}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </button>
              </li>
            ))
          )}
        </ul>
      </ScrollArea>

      <SpecPreviewModal
        open={selected !== null}
        projectId={projectId}
        specId={selected?.id ?? null}
        filename={selected?.filename ?? null}
        onClose={handleClose}
      />
    </>
  );
}
