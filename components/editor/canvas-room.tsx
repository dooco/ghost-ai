"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { ErrorBoundary } from "react-error-boundary";

import { CanvasFlow } from "@/components/editor/canvas-flow";

interface CanvasRoomProps {
  roomId: string;
}

export function CanvasRoom({ roomId }: CanvasRoomProps) {
  return (
    <section className="relative h-[calc(100vh-3.5rem)] p-4">
      <div className="relative h-full overflow-hidden rounded-2xl border border-surface-border bg-bg-base">
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider
            id={roomId}
            initialPresence={{ cursor: null, isThinking: false }}
          >
            <ErrorBoundary fallback={<CanvasError />}>
              <ClientSideSuspense fallback={<CanvasLoading />}>
                <CanvasFlow />
              </ClientSideSuspense>
            </ErrorBoundary>
          </RoomProvider>
        </LiveblocksProvider>
      </div>
    </section>
  );
}

function CanvasLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-copy-faint">Connecting to canvas…</p>
    </div>
  );
}

function CanvasError() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-copy-muted">
        Could not connect to the collaboration room. Please refresh to try
        again.
      </p>
    </div>
  );
}
