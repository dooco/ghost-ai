"use client";

import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { ErrorBoundary } from "react-error-boundary";

import { CanvasFlow } from "@/components/editor/canvas-flow";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";

interface CanvasRoomProps {
  roomId: string;
  isTemplatesOpen?: boolean;
  onTemplatesClose?: () => void;
  onSaveStatusChange?: (status: CanvasSaveStatus) => void;
}

export function CanvasRoom({
  roomId,
  isTemplatesOpen = false,
  onTemplatesClose,
  onSaveStatusChange,
}: CanvasRoomProps) {
  return (
    <section className="relative h-full">
      <div className="relative h-full overflow-hidden bg-bg-base">
        <ErrorBoundary fallback={<CanvasError />}>
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <CanvasFlow
              projectId={roomId}
              isTemplatesOpen={isTemplatesOpen}
              onTemplatesClose={onTemplatesClose}
              onSaveStatusChange={onSaveStatusChange}
            />
          </ClientSideSuspense>
        </ErrorBoundary>
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
