"use client";

import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, type DragEvent } from "react";

import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { ShapePanel } from "@/components/editor/shape-panel";
import {
  CANVAS_DRAG_MIME_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasShapeDragPayload,
} from "@/types/canvas";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

const nodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
};

let dropCounter = 0;

function parseDragPayload(raw: string): CanvasShapeDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as CanvasShapeDragPayload).shape !== "string" ||
      typeof (parsed as CanvasShapeDragPayload).width !== "number" ||
      typeof (parsed as CanvasShapeDragPayload).height !== "number" ||
      !(NODE_SHAPES as readonly string[]).includes(
        (parsed as CanvasShapeDragPayload).shape,
      )
    ) {
      return null;
    }
    return parsed as CanvasShapeDragPayload;
  } catch {
    return null;
  }
}

export function CanvasFlow() {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner />
    </ReactFlowProvider>
  );
}

function CanvasFlowInner() {
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData(CANVAS_DRAG_MIME_TYPE);
      if (!raw) return;

      const payload = parseDragPayload(raw);
      if (!payload) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      dropCounter += 1;
      const newNode: CanvasNode = {
        id: `${payload.shape}-${Date.now()}-${dropCounter}`,
        type: CANVAS_NODE_TYPE,
        position: {
          x: position.x - payload.width / 2,
          y: position.y - payload.height / 2,
        },
        style: {
          width: payload.width,
          height: payload.height,
        },
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          shape: payload.shape,
        },
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [onNodesChange, screenToFlowPosition],
  );

  return (
    <div
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow<CanvasNode, CanvasEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <MiniMap pannable zoomable />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}
