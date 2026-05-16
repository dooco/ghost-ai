"use client";

import { useCallback, useState } from "react";

import type { MockProject } from "@/types/project";

export type ProjectDialogMode = "create" | "rename" | "delete" | null;

export interface UseProjectDialogsResult {
  mode: ProjectDialogMode;
  target: MockProject | null;
  name: string;
  isSubmitting: boolean;
  setName: (value: string) => void;
  openCreate: () => void;
  openRename: (project: MockProject) => void;
  openDelete: (project: MockProject) => void;
  close: () => void;
}

export function useProjectDialogs(): UseProjectDialogsResult {
  const [mode, setMode] = useState<ProjectDialogMode>(null);
  const [target, setTarget] = useState<MockProject | null>(null);
  const [name, setName] = useState("");
  const [isSubmitting] = useState(false);

  const close = useCallback(() => {
    setMode(null);
    setTarget(null);
    setName("");
  }, []);

  const openCreate = useCallback(() => {
    setMode("create");
    setTarget(null);
    setName("");
  }, []);

  const openRename = useCallback((project: MockProject) => {
    setMode("rename");
    setTarget(project);
    setName(project.name);
  }, []);

  const openDelete = useCallback((project: MockProject) => {
    setMode("delete");
    setTarget(project);
    setName("");
  }, []);

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
  };
}
