"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";

import { type CanvasNode as CanvasNodeType, NODE_COLORS } from "@/types/canvas";

export function CanvasNode({ data }: NodeProps<CanvasNodeType>) {
  const palette =
    NODE_COLORS.find((entry) => entry.id === data.color) ?? NODE_COLORS[0];

  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-xl border border-surface-border px-4 py-3 text-sm"
      style={{ backgroundColor: palette.fill, color: palette.text }}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
      <span className="truncate">{data.label || " "}</span>
    </div>
  );
}
