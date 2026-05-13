"use client";

import { useState } from "react";

import { AiSidebarShell } from "@/components/editor/ai-sidebar-shell";
import { CanvasSurface } from "@/components/editor/canvas-surface";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

export function EditorWorkspaceShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isAiSidebarOpen = true;

  return (
    <main className="min-h-screen bg-bg-base text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((current) => !current)}
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <AiSidebarShell isOpen={isAiSidebarOpen} />

      <CanvasSurface />
    </main>
  );
}