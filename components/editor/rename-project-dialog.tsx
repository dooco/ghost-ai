"use client";

import { FormEvent } from "react";

import { EditorDialogShell } from "@/components/editor/editor-dialog-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RenameProjectDialogProps {
  open: boolean;
  currentName: string;
  name: string;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function RenameProjectDialog({
  open,
  currentName,
  name,
  isSubmitting,
  onNameChange,
  onSubmit,
  onClose,
}: RenameProjectDialogProps) {
  const trimmed = name.trim();
  const canSubmit =
    trimmed.length > 0 && trimmed !== currentName && !isSubmitting;

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
      title="Rename project"
      description={`Currently named "${currentName}".`}
      footerActions={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="rename-project-form"
            disabled={!canSubmit}
          >
            Save
          </Button>
        </>
      }
    >
      <form id="rename-project-form" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-copy-secondary">
            Project name
          </span>
          <Input
            autoFocus
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            disabled={isSubmitting}
          />
        </label>
      </form>
    </EditorDialogShell>
  );
}
