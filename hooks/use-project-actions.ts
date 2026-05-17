"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { slugify } from "@/lib/slug";
import type { ProjectSummary } from "@/types/project";

export type ProjectDialogMode = "create" | "rename" | "delete" | null;

interface UseProjectActionsOptions {
  activeProjectId?: string;
}

function generateSuffix(): string {
  return Math.random().toString(36).slice(2, 8).padStart(6, "0");
}

function buildRoomId(name: string): string | null {
  const slug = slugify(name);
  if (!slug) return null;
  return `${slug}-${generateSuffix()}`;
}

export function useProjectActions({
  activeProjectId,
}: UseProjectActionsOptions = {}) {
  const router = useRouter();
  const [mode, setMode] = useState<ProjectDialogMode>(null);
  const [target, setTarget] = useState<ProjectSummary | null>(null);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = useCallback(() => {
    setMode(null);
    setTarget(null);
    setName("");
    setIsSubmitting(false);
  }, []);

  const openCreate = useCallback(() => {
    setMode("create");
    setTarget(null);
    setName("");
  }, []);

  const openRename = useCallback((project: ProjectSummary) => {
    setMode("rename");
    setTarget(project);
    setName(project.name);
  }, []);

  const openDelete = useCallback((project: ProjectSummary) => {
    setMode("delete");
    setTarget(project);
    setName("");
  }, []);

  const submitCreate = useCallback(async () => {
    const trimmed = name.trim();
    const roomId = buildRoomId(trimmed);
    if (!trimmed || !roomId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roomId, name: trimmed }),
      });
      if (!response.ok) {
        setIsSubmitting(false);
        return;
      }
      const data = (await response.json()) as { project: { id: string } };
      close();
      router.push(`/editor/${data.project.id}`);
    } catch {
      setIsSubmitting(false);
    }
  }, [name, close, router]);

  const submitRename = useCallback(async () => {
    if (!target) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === target.name) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!response.ok) {
        setIsSubmitting(false);
        return;
      }
      close();
      router.refresh();
    } catch {
      setIsSubmitting(false);
    }
  }, [name, target, close, router]);

  const submitDelete = useCallback(async () => {
    if (!target) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${target.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setIsSubmitting(false);
        return;
      }
      const wasActive = activeProjectId === target.id;
      close();
      if (wasActive) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } catch {
      setIsSubmitting(false);
    }
  }, [target, close, router, activeProjectId]);

  return {
    mode,
    target,
    name,
    isSubmitting,
    setName,
    openCreate,
    openRename,
    openDelete,
    close,
    submitCreate,
    submitRename,
    submitDelete,
  };
}
