"use client";

import { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditorDialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footerActions?: ReactNode;
}

export function EditorDialogShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  footerActions,
}: EditorDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-surface-border bg-bg-elevated text-copy-primary sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-copy-muted">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {children}

        {footerActions ? <DialogFooter>{footerActions}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}