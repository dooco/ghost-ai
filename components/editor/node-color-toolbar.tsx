"use client";

import { useReactFlow, useStoreApi } from "@xyflow/react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";

import { cn } from "@/lib/utils";
import {
  type CanvasEdge,
  type CanvasNode as CanvasNodeType,
  type CanvasNodeColor,
  NODE_COLORS,
} from "@/types/canvas";

interface NodeColorToolbarProps {
  nodeId: string;
  activeColor: CanvasNodeColor;
}

export function NodeColorToolbar({
  nodeId,
  activeColor,
}: NodeColorToolbarProps) {
  const reactFlow = useReactFlow<CanvasNodeType, CanvasEdge>();
  const store = useStoreApi<CanvasNodeType, CanvasEdge>();

  const handleSelect = (color: CanvasNodeColor) => {
    if (color === activeColor) return;
    const node = reactFlow.getNode(nodeId);
    if (!node) return;
    store.getState().triggerNodeChanges([
      {
        type: "replace",
        id: nodeId,
        item: { ...node, data: { ...node.data, color } },
      },
    ]);
  };

  const stopPropagation = (event: ReactMouseEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      className="nodrag nopan flex items-center gap-1 rounded-full border border-surface-border bg-bg-elevated/95 p-1.5 shadow-lg backdrop-blur"
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
    >
      {NODE_COLORS.map((entry) => {
        const isActive = entry.id === activeColor;
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => handleSelect(entry.id)}
            aria-label={`Set color ${entry.id}`}
            aria-pressed={isActive}
            title={entry.id}
            style={
              {
                backgroundColor: entry.fill,
                "--swatch-glow": entry.text,
              } as CSSProperties
            }
            className={cn(
              "h-5 w-5 rounded-full transition-shadow",
              "hover:shadow-[0_0_6px_var(--swatch-glow)]",
              isActive
                ? "ring-2 ring-[var(--swatch-glow)]"
                : "border border-surface-border",
            )}
          />
        );
      })}
    </div>
  );
}
