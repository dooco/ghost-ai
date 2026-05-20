"use client";

import {
  Handle,
  NodeResizer,
  NodeToolbar,
  type NodeProps,
  Position,
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

import { NodeColorToolbar } from "@/components/editor/node-color-toolbar";
import { ShapeBackground } from "@/components/editor/shape-background";
import { cn } from "@/lib/utils";
import {
  type CanvasEdge,
  type CanvasNode as CanvasNodeType,
  NODE_COLORS,
} from "@/types/canvas";

const MIN_NODE_WIDTH = 60;
const MIN_NODE_HEIGHT = 40;
const LABEL_PLACEHOLDER = "Label";

const HANDLE_BASE_CLASS =
  "!h-2.5 !w-2.5 !rounded-full !bg-white !border-2 !border-[var(--bg-base)] !opacity-0 transition-opacity duration-150 group-hover:!opacity-100";

export function CanvasNode({ id, data, selected }: NodeProps<CanvasNodeType>) {
  const palette =
    NODE_COLORS.find((entry) => entry.id === data.color) ?? NODE_COLORS[0];

  const reactFlow = useReactFlow<CanvasNodeType, CanvasEdge>();
  const store = useStoreApi<CanvasNodeType, CanvasEdge>();
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = useCallback(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      resizeTextarea();
    }
  }, [isEditing, resizeTextarea]);

  useEffect(() => {
    if (isEditing) resizeTextarea();
  }, [isEditing, data.label, resizeTextarea]);

  const handleDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (isEditing) return;
    event.stopPropagation();
    setIsEditing(true);
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const node = reactFlow.getNode(id);
    if (!node) return;
    store.getState().triggerNodeChanges([
      {
        type: "replace",
        id,
        item: { ...node, data: { ...node.data, label: event.target.value } },
      },
    ]);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setIsEditing(false);
    }
  };

  return (
    <div
      className="group relative h-full w-full"
      onDoubleClick={handleDoubleClick}
    >
      <NodeToolbar isVisible={selected} position={Position.Top} offset={12}>
        <NodeColorToolbar nodeId={id} activeColor={data.color} />
      </NodeToolbar>
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        color="var(--text-muted)"
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
        }}
        lineStyle={{
          borderColor: "var(--border-default)",
        }}
      />
      <ShapeBackground
        shape={data.shape}
        color={data.color}
        selected={selected ?? false}
      />
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className={HANDLE_BASE_CLASS}
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className={HANDLE_BASE_CLASS}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className={HANDLE_BASE_CLASS}
      />
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className={HANDLE_BASE_CLASS}
      />
      <div className="pointer-events-none relative flex h-full w-full items-center justify-center overflow-hidden px-4 py-3 text-sm">
        <span
          className={cn(
            "block w-full whitespace-pre-wrap break-words text-center leading-snug",
            isEditing && "invisible",
          )}
          style={{
            color: palette.text,
            opacity: data.label ? 1 : 0.5,
          }}
        >
          {data.label || LABEL_PLACEHOLDER}
        </span>
      </div>
      {isEditing && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-4 py-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={data.label}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={LABEL_PLACEHOLDER}
            className="nodrag nopan block max-h-full w-full resize-none overflow-hidden whitespace-pre-wrap break-words border-0 bg-transparent text-center text-sm leading-snug outline-none placeholder:opacity-50"
            style={{ color: palette.text }}
          />
        </div>
      )}
    </div>
  );
}
