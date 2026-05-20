"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";

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
    <aside
      className={cn(
        "shrink-0 overflow-hidden border-r border-surface-border bg-bg-surface transition-[width] duration-300 ease-out",
        isOpen ? "w-72" : "w-0",
      )}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full w-72 flex-col p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-copy-muted">
            Projects
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close project sidebar"
            className="h-7 w-7 text-copy-secondary hover:bg-bg-subtle hover:text-copy-primary"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Tabs
          defaultValue="my-projects"
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="grid h-9 w-full grid-cols-2 bg-bg-subtle text-xs text-copy-muted">
            <TabsTrigger
              value="my-projects"
              className="text-xs data-[state=active]:bg-bg-elevated data-[state=active]:text-copy-primary"
            >
              My Projects
            </TabsTrigger>
            <TabsTrigger
              value="shared"
              className="text-xs data-[state=active]:bg-bg-elevated data-[state=active]:text-copy-primary"
            >
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="my-projects"
            className="mt-3 flex-1 overflow-y-auto"
          >
            {ownedProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-surface-border bg-bg-subtle/40 p-3">
                <p className="text-xs text-copy-muted">No projects yet.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-0.5">
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

          <TabsContent value="shared" className="mt-3 flex-1 overflow-y-auto">
            {sharedProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-surface-border bg-bg-subtle/40 p-3">
                <p className="text-xs text-copy-muted">
                  No shared projects yet.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-0.5">
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

        <Button
          type="button"
          size="sm"
          className="mt-3 w-full"
          onClick={onCreate}
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Button>
      </div>
    </aside>
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
        "group flex items-center gap-2 rounded-xl px-1 hover:bg-bg-subtle",
        isActive && "bg-bg-subtle ring-1 ring-inset ring-surface-border",
      )}
    >
      <Link
        href={`/editor/${project.id}`}
        className="min-w-0 flex-1 rounded-lg px-2 py-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-surface-border"
      >
        <p className="truncate text-xs text-copy-primary">{project.name}</p>
      </Link>

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
