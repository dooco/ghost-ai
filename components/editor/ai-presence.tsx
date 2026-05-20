"use client";

import { useEventListener } from "@liveblocks/react/suspense";
import { useStore } from "@xyflow/react";
import { Bot } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface AiPresenceState {
  thinking: boolean;
  cursor: { x: number; y: number } | null;
}

const INITIAL_STATE: AiPresenceState = { thinking: false, cursor: null };

export function AiPresence() {
  const [state, setState] = useState<AiPresenceState>(INITIAL_STATE);
  const transform = useStore((s) => s.transform);

  useEventListener(({ event }) => {
    switch (event.kind) {
      case "ai:start":
        setState({ thinking: true, cursor: null });
        return;
      case "ai:thinking":
        setState((prev) => ({ ...prev, thinking: event.thinking }));
        return;
      case "ai:cursor":
        setState((prev) => ({ ...prev, cursor: event.cursor }));
        return;
      case "ai:complete":
      case "ai:error":
        setState({ thinking: false, cursor: null });
        return;
      default:
        return;
    }
  });

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  useEffect(() => {
    if (!state.thinking && !state.cursor) return;
    const timeout = window.setTimeout(reset, 30_000);
    return () => window.clearTimeout(timeout);
  }, [state, reset]);

  if (!state.cursor) return null;

  const [viewportX, viewportY, zoom] = transform;
  const screenX = state.cursor.x * zoom + viewportX;
  const screenY = state.cursor.y * zoom + viewportY;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute left-0 top-0 flex items-center gap-1.5 will-change-transform"
        style={{ transform: `translate3d(${screenX}px, ${screenY}px, 0)` }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-ai text-white shadow-lg">
          <Bot className="h-3.5 w-3.5" />
        </div>
        <div className="rounded-md bg-accent-ai px-1.5 py-0.5 text-[11px] font-medium text-white shadow">
          Ghost AI
        </div>
      </div>
    </div>
  );
}
