"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 1000;

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled?: boolean;
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled = true,
}: UseCanvasAutosaveOptions) {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerializedRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const pendingRef = useRef<string | null>(null);
  const fatalStatusRef = useRef<number | null>(null);

  useEffect(() => {
    fatalStatusRef.current = null;
  }, [projectId]);

  const save = useCallback(
    async (serialized: string) => {
      if (fatalStatusRef.current) {
        return;
      }

      if (inFlightRef.current) {
        pendingRef.current = serialized;
        return;
      }

      inFlightRef.current = true;
      setStatus("saving");

      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: serialized,
        });

        if (!response.ok) {
          let message = `Save failed (${response.status})`;

          try {
            const data = (await response.json()) as { error?: unknown };
            if (typeof data.error === "string" && data.error.length > 0) {
              message = data.error;
            }
          } catch {
            // Ignore response parsing errors and keep the fallback message.
          }

          if (
            response.status === 401 ||
            response.status === 403 ||
            response.status === 404
          ) {
            fatalStatusRef.current = response.status;
          }

          console.warn("Canvas autosave failed", {
            projectId,
            status: response.status,
            message,
          });
          setStatus("error");
          return;
        }

        lastSerializedRef.current = serialized;
        setStatus("saved");
      } catch (error) {
        console.error("Canvas autosave request failed", {
          projectId,
          message: error instanceof Error ? error.message : String(error),
        });
        setStatus("error");
      } finally {
        inFlightRef.current = false;
        const queued = pendingRef.current;
        pendingRef.current = null;
        if (
          !fatalStatusRef.current &&
          queued &&
          queued !== lastSerializedRef.current
        ) {
          void save(queued);
        }
      }
    },
    [projectId],
  );

  useEffect(() => {
    if (!enabled || fatalStatusRef.current) return;

    const serialized = JSON.stringify({ nodes, edges });
    if (serialized === lastSerializedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void save(serialized);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, nodes, edges, save]);

  return { status };
}
