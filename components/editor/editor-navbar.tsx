"use client";

import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  isAiSidebarOpen: boolean;
  onSidebarToggle: () => void;
  onAiSidebarToggle: () => void;
  onShareClick?: () => void;
  projectName?: string;
}

export function EditorNavbar({
  isSidebarOpen,
  isAiSidebarOpen,
  onSidebarToggle,
  onAiSidebarToggle,
  onShareClick,
  projectName,
}: EditorNavbarProps) {
  const inProject = Boolean(projectName);

  return (
    <header className="h-14 border-b border-surface-border bg-bg-surface">
      <div className="grid h-full grid-cols-[auto_1fr_auto] items-center px-4">
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            aria-label={
              isSidebarOpen ? "Close project sidebar" : "Open project sidebar"
            }
            className="text-copy-secondary hover:bg-bg-subtle hover:text-copy-primary"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-center px-4">
          {inProject ? (
            <h1 className="truncate text-sm font-medium text-copy-primary">
              {projectName}
            </h1>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {inProject ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onShareClick}
                className="text-copy-secondary hover:bg-bg-subtle hover:text-copy-primary"
              >
                <Share2 className="h-4 w-4" />
                Share
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
                className="text-copy-secondary hover:bg-bg-subtle hover:text-copy-primary"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </>
          ) : null}
          <UserButton />
        </div>
      </div>
    </header>
  );
}
