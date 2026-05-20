"use client";

import type { ReactFlowInstance } from "@xyflow/react";
import { useEffect } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface UseKeyboardShortcutsOptions {
  reactFlow: ReactFlowInstance<CanvasNode, CanvasEdge>;
  onUndo: () => void;
  onRedo: () => void;
}

const ZOOM_DURATION_MS = 200;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts({
  reactFlow,
  onUndo,
  onRedo,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      const isMod = event.metaKey || event.ctrlKey;

      if (isMod && (event.key === "z" || event.key === "Z")) {
        event.preventDefault();
        if (event.shiftKey) onRedo();
        else onUndo();
        return;
      }

      if (isMod && (event.key === "y" || event.key === "Y")) {
        event.preventDefault();
        onRedo();
        return;
      }

      if (isMod || event.altKey) return;

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        reactFlow.zoomIn({ duration: ZOOM_DURATION_MS });
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        reactFlow.zoomOut({ duration: ZOOM_DURATION_MS });
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reactFlow, onUndo, onRedo]);
}
