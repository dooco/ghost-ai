"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { MockProject } from "@/types/project";

interface ProjectSidebarProps {
  isOpen: boolean;
  projects: MockProject[];
  onClose?: () => void;
  onCreate: () => void;
  onRename: (project: MockProject) => void;
  onDelete: (project: MockProject) => void;
}

export function ProjectSidebar({
  isOpen,
  projects,
  onClose,
  onCreate,
  onRename,
  onDelete,
}: ProjectSidebarProps) {
  const ownedProjects = projects.filter((p) => p.ownership === "owned");
  const sharedProjects = projects.filter((p) => p.ownership === "shared");

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={onClose ? () => onClose() : undefined}
        className={cn(
          "fixed inset-0 z-20 bg-black/50 transition-opacity duration-300 md:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "pointer-events-none fixed bottom-0 left-0 top-14 z-30 w-80 p-4 transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!isOpen}
      >
        <div className="pointer-events-auto flex h-full flex-col rounded-2xl border border-surface-border bg-bg-elevated/95 p-4 backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-copy-primary">
              Projects
            </h2>
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

          <Tabs
            defaultValue="my-projects"
            className="flex min-h-0 flex-1 flex-col"
          >
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

            <TabsContent
              value="my-projects"
              className="mt-4 flex-1 overflow-y-auto"
            >
              {ownedProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-surface-border bg-bg-subtle/40 p-4">
                  <p className="text-sm text-copy-muted">No projects yet.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {ownedProjects.map((project) => (
                    <ProjectListItem
                      key={project.id}
                      project={project}
                      onRename={onRename}
                      onDelete={onDelete}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="shared" className="mt-4 flex-1 overflow-y-auto">
              {sharedProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-surface-border bg-bg-subtle/40 p-4">
                  <p className="text-sm text-copy-muted">
                    No shared projects yet.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {sharedProjects.map((project) => (
                    <ProjectListItem key={project.id} project={project} />
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>

          <Button type="button" className="mt-4 w-full" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}

interface ProjectListItemProps {
  project: MockProject;
  onRename?: (project: MockProject) => void;
  onDelete?: (project: MockProject) => void;
}

function ProjectListItem({
  project,
  onRename,
  onDelete,
}: ProjectListItemProps) {
  const showActions = project.ownership === "owned" && (onRename || onDelete);

  return (
    <li className="group flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-bg-subtle">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-copy-primary">{project.name}</p>
        <p className="truncate font-mono text-xs text-copy-faint">
          {project.slug}
        </p>
      </div>

      {showActions ? (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {onRename ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-copy-secondary hover:bg-bg-elevated hover:text-copy-primary"
              onClick={() => onRename(project)}
              aria-label={`Rename ${project.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-copy-secondary hover:bg-bg-elevated hover:text-destructive"
              onClick={() => onDelete(project)}
              aria-label={`Delete ${project.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
