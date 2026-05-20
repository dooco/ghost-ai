"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { useState } from "react";

import { AiSidebarShell } from "@/components/editor/ai-sidebar-shell";
import { CanvasRoom } from "@/components/editor/canvas-room";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { EditorHome } from "@/components/editor/editor-home";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { PresenceAvatars } from "@/components/editor/presence-avatars";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { ShareDialog } from "@/components/editor/share-dialog";
import { type CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
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
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("idle");

  const actions = useProjectActions({ activeProjectId });
  const hasActiveProject = Boolean(activeProjectId);

  const workspaceContent = (
    <>
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        isAiSidebarOpen={isAiSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((current) => !current)}
        onAiSidebarToggle={() => setIsAiSidebarOpen((current) => !current)}
        onShareClick={hasActiveProject ? () => setIsShareOpen(true) : undefined}
        onTemplatesClick={
          hasActiveProject ? () => setIsTemplatesOpen(true) : undefined
        }
        projectName={projectName}
        saveStatus={hasActiveProject ? saveStatus : undefined}
        presenceSlot={
          hasActiveProject ? (
            <ClientSideSuspense fallback={null}>
              <PresenceAvatars />
            </ClientSideSuspense>
          ) : undefined
        }
      />

      <div className="flex min-h-0 flex-1">
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

        <div className="min-w-0 flex-1">
          {hasActiveProject && activeProjectId ? (
            <CanvasRoom
              roomId={activeProjectId}
              isTemplatesOpen={isTemplatesOpen}
              onTemplatesClose={() => setIsTemplatesOpen(false)}
              onSaveStatusChange={setSaveStatus}
            />
          ) : (
            <EditorHome onCreateProject={actions.openCreate} />
          )}
        </div>

        {hasActiveProject ? (
          <ClientSideSuspense fallback={null}>
            <AiSidebarShell
              isOpen={isAiSidebarOpen}
              onClose={() => setIsAiSidebarOpen(false)}
              projectId={activeProjectId}
            />
          </ClientSideSuspense>
        ) : null}
      </div>
    </>
  );

  return (
    <main className="flex h-screen flex-col bg-bg-base text-copy-primary">
      {hasActiveProject && activeProjectId ? (
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider
            id={activeProjectId}
            initialPresence={{ cursor: null, thinking: false }}
          >
            {workspaceContent}
          </RoomProvider>
        </LiveblocksProvider>
      ) : (
        workspaceContent
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
