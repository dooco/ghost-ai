"use client";

import { useState } from "react";

import { AiSidebarShell } from "@/components/editor/ai-sidebar-shell";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { EditorHome } from "@/components/editor/editor-home";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import { MOCK_PROJECTS } from "@/lib/mock-projects";
import { slugify } from "@/lib/slug";
import type { MockProject } from "@/types/project";

export function EditorWorkspaceShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isAiSidebarOpen = true;

  const [projects, setProjects] = useState<MockProject[]>(MOCK_PROJECTS);
  const dialogs = useProjectDialogs();

  const handleCreate = () => {
    const trimmed = dialogs.name.trim();
    const slug = slugify(trimmed);
    if (!trimmed || !slug) return;

    const newProject: MockProject = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `mock-${Date.now()}`,
      name: trimmed,
      slug,
      ownership: "owned",
    };
    setProjects((current) => [...current, newProject]);
    dialogs.close();
  };

  const handleRename = () => {
    const target = dialogs.target;
    const trimmed = dialogs.name.trim();
    if (!target || !trimmed || trimmed === target.name) return;

    setProjects((current) =>
      current.map((project) =>
        project.id === target.id
          ? { ...project, name: trimmed, slug: slugify(trimmed) }
          : project,
      ),
    );
    dialogs.close();
  };

  const handleDelete = () => {
    const target = dialogs.target;
    if (!target) return;

    setProjects((current) =>
      current.filter((project) => project.id !== target.id),
    );
    dialogs.close();
  };

  return (
    <main className="min-h-screen bg-bg-base text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((current) => !current)}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        projects={projects}
        onClose={() => setIsSidebarOpen(false)}
        onCreate={dialogs.openCreate}
        onRename={dialogs.openRename}
        onDelete={dialogs.openDelete}
      />

      <AiSidebarShell isOpen={isAiSidebarOpen} />

      <EditorHome onCreateProject={dialogs.openCreate} />

      <CreateProjectDialog
        open={dialogs.mode === "create"}
        name={dialogs.name}
        isSubmitting={dialogs.isSubmitting}
        onNameChange={dialogs.setName}
        onSubmit={handleCreate}
        onClose={dialogs.close}
      />

      <RenameProjectDialog
        open={dialogs.mode === "rename"}
        currentName={dialogs.target?.name ?? ""}
        name={dialogs.name}
        isSubmitting={dialogs.isSubmitting}
        onNameChange={dialogs.setName}
        onSubmit={handleRename}
        onClose={dialogs.close}
      />

      <DeleteProjectDialog
        open={dialogs.mode === "delete"}
        projectName={dialogs.target?.name ?? ""}
        isSubmitting={dialogs.isSubmitting}
        onConfirm={handleDelete}
        onClose={dialogs.close}
      />
    </main>
  );
}
