"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <aside
      className={cn(
        "pointer-events-none fixed bottom-0 left-0 top-14 z-30 w-80 p-4 transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      aria-hidden={!isOpen}
    >
      <div className="pointer-events-auto flex h-full flex-col rounded-2xl border border-surface-border bg-bg-elevated/95 p-4 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-copy-primary">Projects</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close project sidebar"
            className="text-copy-secondary hover:bg-bg-subtle hover:text-copy-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid h-10 w-full grid-cols-2 bg-bg-subtle text-copy-muted">
            <TabsTrigger
              value="my-projects"
              className="data-[state=active]:bg-bg-surface data-[state=active]:text-copy-primary"
            >
              My Projects
            </TabsTrigger>
            <TabsTrigger
              value="shared"
              className="data-[state=active]:bg-bg-surface data-[state=active]:text-copy-primary"
            >
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="mt-4 flex-1 rounded-xl border border-dashed border-surface-border bg-bg-subtle/40 p-4">
            <p className="text-sm text-copy-muted">No projects yet.</p>
          </TabsContent>

          <TabsContent value="shared" className="mt-4 flex-1 rounded-xl border border-dashed border-surface-border bg-bg-subtle/40 p-4">
            <p className="text-sm text-copy-muted">No shared projects yet.</p>
          </TabsContent>
        </Tabs>

        <Button type="button" className="mt-4 w-full">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  );
}