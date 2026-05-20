"use client";

import {
  AlertCircle,
  Check,
  LayoutTemplate,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Share2,
  Sparkles,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { cn } from "@/lib/utils";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  isAiSidebarOpen: boolean;
  onSidebarToggle: () => void;
  onAiSidebarToggle: () => void;
  onShareClick?: () => void;
  onTemplatesClick?: () => void;
  projectName?: string;
  saveStatus?: CanvasSaveStatus;
  presenceSlot?: React.ReactNode;
}

function SaveStatusBadge({ status }: { status: CanvasSaveStatus }) {
  const iconClass = "h-3.5 w-3.5";
  const config: Record<
    CanvasSaveStatus,
    { icon: typeof Save; label: string; tone: string }
  > = {
    idle: {
      icon: Save,
      label: "Saved",
      tone: "text-copy-muted",
    },
    saving: {
      icon: Loader2,
      label: "Saving…",
      tone: "text-copy-muted",
    },
    saved: {
      icon: Check,
      label: "Saved",
      tone: "text-copy-secondary",
    },
    error: {
      icon: AlertCircle,
      label: "Save failed",
      tone: "text-red-400",
    },
  };

  const { icon: Icon, label, tone } = config[status];

  return (
    <div
      role="status"
      aria-live="polite"
      title={label}
      aria-label={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md",
        tone,
      )}
    >
      <Icon className={cn(iconClass, status === "saving" && "animate-spin")} />
    </div>
  );
}

export function EditorNavbar({
  isSidebarOpen,
  isAiSidebarOpen,
  onSidebarToggle,
  onAiSidebarToggle,
  onShareClick,
  onTemplatesClick,
  projectName,
  saveStatus,
  presenceSlot,
}: EditorNavbarProps) {
  const inProject = Boolean(projectName);

  return (
    <header className="h-11 border-b border-surface-border bg-bg-surface">
      <div className="grid h-full grid-cols-[auto_1fr_auto] items-center px-3">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            aria-label={
              isSidebarOpen ? "Close project sidebar" : "Open project sidebar"
            }
            className="h-8 w-8 text-copy-secondary hover:bg-bg-subtle hover:text-copy-primary"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-center px-2">
          {inProject ? (
            <h1 className="truncate text-xs font-medium tracking-wide text-copy-primary">
              {projectName}
            </h1>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          {inProject ? (
            <>
              {saveStatus ? <SaveStatusBadge status={saveStatus} /> : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onTemplatesClick}
                aria-label="Open starter templates"
                title="Starter templates"
                className="h-8 w-8 text-copy-secondary hover:bg-bg-subtle hover:text-copy-primary"
              >
                <LayoutTemplate className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onShareClick}
                aria-label="Share project"
                title="Share"
                className="h-8 w-8 text-copy-secondary hover:bg-bg-subtle hover:text-copy-primary"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onAiSidebarToggle}
                aria-label={
                  isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"
                }
                aria-pressed={isAiSidebarOpen}
                className={cn(
                  "h-8 w-8 text-copy-secondary hover:bg-bg-subtle hover:text-copy-primary",
                  isAiSidebarOpen && "bg-bg-subtle text-copy-primary",
                )}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              {presenceSlot ? (
                <div className="ml-1 flex items-center">{presenceSlot}</div>
              ) : null}
            </>
          ) : (
            <UserButton />
          )}
        </div>
      </div>
    </header>
  );
}
