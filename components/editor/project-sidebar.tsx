"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/types/project";

interface ProjectSidebarProps {
  isOpen: boolean;
  ownedProjects: ProjectSummary[];
  sharedProjects: ProjectSummary[];
  activeProjectId?: string;
  onClose?: () => void;
  onCreate: () => void;
  onRename: (project: ProjectSummary) => void;
  onDelete: (project: ProjectSummary) => void;
}

export function ProjectSidebar({
  isOpen,
  ownedProjects,
  sharedProjects,
  activeProjectId,
  onClose,
  onCreate,
  onRename,
  onDelete,
}: ProjectSidebarProps) {
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
                      isActive={project.id === activeProjectId}
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
                    <ProjectListItem
                      key={project.id}
                      project={project}
                      isActive={project.id === activeProjectId}
                    />
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
  project: ProjectSummary;
  isActive?: boolean;
  onRename?: (project: ProjectSummary) => void;
  onDelete?: (project: ProjectSummary) => void;
}

function ProjectListItem({
  project,
  isActive,
  onRename,
  onDelete,
}: ProjectListItemProps) {
  const showActions = project.ownership === "owned" && (onRename || onDelete);

  return (
    <li
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-bg-subtle",
        isActive && "bg-bg-subtle ring-1 ring-inset ring-surface-border",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-copy-primary">{project.name}</p>
        <p className="truncate font-mono text-xs text-copy-faint">
          {project.id}
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
