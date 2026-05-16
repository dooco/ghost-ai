"use client";

import { EditorDialogShell } from "@/components/editor/editor-dialog-shell";
import { Button } from "@/components/ui/button";

interface DeleteProjectDialogProps {
  open: boolean;
  projectName: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteProjectDialog({
  open,
  projectName,
  isSubmitting,
  onConfirm,
  onClose,
}: DeleteProjectDialogProps) {
  return (
    <EditorDialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Delete project?"
      description={`This will permanently delete "${projectName}". This action cannot be undone.`}
      footerActions={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            Delete project
          </Button>
        </>
      }
    />
  );
}
