"use client";

import {
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
  useReactFlow,
  useStoreApi,
} from "@xyflow/react";
import {
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";
import type { CanvasEdge as CanvasEdgeType, CanvasNode } from "@/types/canvas";

const REST_STROKE = "var(--text-faint)";
const ACTIVE_STROKE = "var(--text-secondary)";
const EDGE_RADIUS = 10;
const INTERACTION_WIDTH = 20;
const STROKE_WIDTH = 1.5;
const LABEL_HINT = "Add label";
const LABEL_PLACEHOLDER = "Label";

export function CanvasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<CanvasEdgeType>) {
  const reactFlow = useReactFlow<CanvasNode, CanvasEdgeType>();
  const store = useStoreApi<CanvasNode, CanvasEdgeType>();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = useCallback(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, []);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: EDGE_RADIUS,
  });

  const label = data?.label ?? "";
  const isActive = isHovered || (selected ?? false) || isEditing;
  const stroke = isActive ? ACTIVE_STROKE : REST_STROKE;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      resizeTextarea();
    }
  }, [isEditing, resizeTextarea]);

  useEffect(() => {
    if (isEditing) resizeTextarea();
  }, [isEditing, label, resizeTextarea]);

  const updateLabel = (next: string) => {
    const edge = reactFlow.getEdge(id);
    if (!edge) return;
    store.getState().triggerEdgeChanges([
      {
        type: "replace",
        id,
        item: { ...edge, data: { ...(edge.data ?? {}), label: next } },
      },
    ]);
  };

  const beginEditing = (event?: ReactMouseEvent) => {
    event?.stopPropagation();
    if (!isEditing) setIsEditing(true);
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    updateLabel(event.target.value);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={markerEnd}
        className="react-flow__edge-path"
        style={{ transition: "stroke 120ms ease" }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={INTERACTION_WIDTH}
        className="react-flow__edge-interaction"
        style={{ pointerEvents: "stroke", cursor: "pointer" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={beginEditing}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={beginEditing}
        >
          {isEditing ? (
            <textarea
              ref={inputRef}
              rows={1}
              value={label}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={LABEL_PLACEHOLDER}
              className={cn(
                "block w-[12rem] max-w-[12rem] resize-none overflow-hidden",
                "rounded-2xl border border-surface-border bg-bg-elevated px-3 py-1",
                "text-center text-xs leading-snug text-copy-primary shadow-sm outline-none",
                "whitespace-pre-wrap break-words placeholder:text-copy-faint",
              )}
            />
          ) : label ? (
            <span className="inline-block max-w-[12rem] whitespace-pre-wrap break-words rounded-2xl border border-surface-border bg-bg-elevated px-3 py-1 text-center text-xs leading-snug text-copy-primary shadow-sm">
              {label}
            </span>
          ) : isActive ? (
            <span className="inline-block rounded-2xl border border-surface-border bg-bg-elevated/70 px-3 py-1 text-xs leading-snug text-copy-faint">
              {LABEL_HINT}
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
