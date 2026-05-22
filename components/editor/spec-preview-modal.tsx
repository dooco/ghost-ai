"use client";

import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpecPreviewModalProps {
  open: boolean;
  projectId: string;
  specId: string | null;
  filename: string | null;
  onClose: () => void;
}

export function SpecPreviewModal({
  open,
  projectId,
  specId,
  filename,
  onClose,
}: SpecPreviewModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !specId) {
      setContent(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    setContent(null);

    fetch(`/api/projects/${projectId}/specs/${specId}/download`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load spec (status ${response.status})`);
        }
        return response.text();
      })
      .then((text) => {
        setContent(text);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load spec");
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [open, projectId, specId]);

  const downloadHref = specId
    ? `/api/projects/${projectId}/specs/${specId}/download`
    : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-2xl gap-4 rounded-3xl border border-surface-border bg-bg-elevated p-6 text-copy-primary">
        <DialogHeader className="flex flex-row items-center justify-between gap-3 pr-8">
          <DialogTitle className="text-base font-semibold text-copy-primary">
            {filename ?? "Spec preview"}
          </DialogTitle>
          {downloadHref ? (
            <Button
              asChild
              type="button"
              size="sm"
              className="bg-accent-ai text-white hover:bg-accent-ai/90"
            >
              <a href={downloadHref} download={filename ?? undefined}>
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </Button>
          ) : null}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] rounded-2xl border border-surface-border bg-bg-surface">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-copy-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading spec…
              </div>
            ) : error ? (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            ) : content ? (
              <div className="max-w-none text-sm text-copy-primary [&_a]:text-brand [&_a]:underline [&_code]:rounded [&_code]:bg-bg-subtle [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_h1]:mb-3 [&_h1]:mt-0 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-copy-primary [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-copy-primary [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-copy-primary [&_li]:my-1 [&_li]:text-copy-secondary [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_p]:text-copy-secondary [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-surface-border [&_pre]:bg-bg-subtle [&_pre]:p-3 [&_strong]:text-copy-primary [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-copy-muted">No content.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
