"use client";

import { useOthers } from "@liveblocks/react/suspense";
import { useStore } from "@xyflow/react";

const FALLBACK_COLOR = "#808090";

export function PresenceCursors() {
  const others = useOthers();
  const transform = useStore((state) => state.transform);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {others.map((other) => {
        const cursor = other.presence.cursor;
        if (!cursor) return null;

        const [viewportX, viewportY, zoom] = transform;
        const screenX = cursor.x * zoom + viewportX;
        const screenY = cursor.y * zoom + viewportY;

        const color = other.info?.color ?? FALLBACK_COLOR;
        const name = other.info?.name ?? "Collaborator";

        return (
          <CursorMarker
            key={other.connectionId}
            x={screenX}
            y={screenY}
            color={color}
            name={name}
          />
        );
      })}
    </div>
  );
}

interface CursorMarkerProps {
  x: number;
  y: number;
  color: string;
  name: string;
}

function CursorMarker({ x, y, color, name }: CursorMarkerProps) {
  return (
    <div
      className="absolute left-0 top-0 will-change-transform"
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M3 2L17 9.5L10 11.5L7 17.5L3 2Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="ml-3 mt-0.5 inline-flex max-w-[160px] truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white shadow"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
}
