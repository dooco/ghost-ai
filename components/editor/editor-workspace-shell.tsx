"use client";

import { useState } from "react";

import { AiSidebarShell } from "@/components/editor/ai-sidebar-shell";
import { CanvasSurface } from "@/components/editor/canvas-surface";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { EditorHome } from "@/components/editor/editor-home";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { ShareDialog } from "@/components/editor/share-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectSummary } from "@/types/project";

interface EditorWorkspaceShellProps {
  ownedProjects: ProjectSummary[];
  sharedProjects: ProjectSummary[];
  activeProjectId?: string;
  projectName?: string;
  isOwner?: boolean;
}

export function EditorWorkspaceShell({
  ownedProjects,
  sharedProjects,
  activeProjectId,
  projectName,
  isOwner = false,
}: EditorWorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const actions = useProjectActions({ activeProjectId });
  const hasActiveProject = Boolean(activeProjectId);

  return (
    <main className="min-h-screen bg-bg-base text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        isAiSidebarOpen={isAiSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((current) => !current)}
        onAiSidebarToggle={() => setIsAiSidebarOpen((current) => !current)}
        onShareClick={hasActiveProject ? () => setIsShareOpen(true) : undefined}
        projectName={projectName}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeProjectId={activeProjectId}
        onClose={() => setIsSidebarOpen(false)}
        onCreate={actions.openCreate}
        onRename={actions.openRename}
        onDelete={actions.openDelete}
      />

      {hasActiveProject ? <AiSidebarShell isOpen={isAiSidebarOpen} /> : null}

      {hasActiveProject ? (
        <CanvasSurface />
      ) : (
        <EditorHome onCreateProject={actions.openCreate} />
      )}

      <CreateProjectDialog
        open={actions.mode === "create"}
        name={actions.name}
        isSubmitting={actions.isSubmitting}
        onNameChange={actions.setName}
        onSubmit={actions.submitCreate}
        onClose={actions.close}
      />

      <RenameProjectDialog
        open={actions.mode === "rename"}
        currentName={actions.target?.name ?? ""}
        name={actions.name}
        isSubmitting={actions.isSubmitting}
        onNameChange={actions.setName}
        onSubmit={actions.submitRename}
        onClose={actions.close}
      />

      <DeleteProjectDialog
        open={actions.mode === "delete"}
        projectName={actions.target?.name ?? ""}
        isSubmitting={actions.isSubmitting}
        onConfirm={actions.submitDelete}
        onClose={actions.close}
      />

      {hasActiveProject && activeProjectId ? (
        <ShareDialog
          open={isShareOpen}
          projectId={activeProjectId}
          isOwner={isOwner}
          onClose={() => setIsShareOpen(false)}
        />
      ) : null}
    </main>
  );
}
