"use client";

import { useCanRedo, useCanUndo, useRedo, useUndo } from "@liveblocks/react";
import { useUpdateMyPresence } from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  type DefaultEdgeOptions,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { AiPresence } from "@/components/editor/ai-presence";
import { CanvasControls } from "@/components/editor/canvas-controls";
import { CanvasEdge as CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { PresenceCursors } from "@/components/editor/presence-cursors";
import { ShapePanel } from "@/components/editor/shape-panel";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import {
  useCanvasAutosave,
  type CanvasSaveStatus,
} from "@/hooks/use-canvas-autosave";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  CANVAS_DRAG_MIME_TYPE,
  CANVAS_EDGE_TYPE,
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

const edgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: CANVAS_EDGE_TYPE,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "var(--text-secondary)",
    width: 18,
    height: 18,
  },
};

const ZOOM_DURATION_MS = 200;

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

interface CanvasFlowProps {
  projectId: string;
  isTemplatesOpen?: boolean;
  onTemplatesClose?: () => void;
  onSaveStatusChange?: (status: CanvasSaveStatus) => void;
}

export function CanvasFlow({
  projectId,
  isTemplatesOpen = false,
  onTemplatesClose,
  onSaveStatusChange,
}: CanvasFlowProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner
        projectId={projectId}
        isTemplatesOpen={isTemplatesOpen}
        onTemplatesClose={onTemplatesClose}
        onSaveStatusChange={onSaveStatusChange}
      />
    </ReactFlowProvider>
  );
}

function CanvasFlowInner({
  projectId,
  isTemplatesOpen,
  onTemplatesClose,
  onSaveStatusChange,
}: Required<Pick<CanvasFlowProps, "isTemplatesOpen" | "projectId">> &
  Pick<CanvasFlowProps, "onTemplatesClose" | "onSaveStatusChange">) {
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const { screenToFlowPosition } = reactFlow;
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const updateMyPresence = useUpdateMyPresence();

  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const loadAttemptedRef = useRef(false);

  useEffect(() => {
    if (loadAttemptedRef.current) return;
    loadAttemptedRef.current = true;

    if (nodes.length > 0 || edges.length > 0) {
      setAutosaveEnabled(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`);
        if (!response.ok) {
          if (!cancelled) setAutosaveEnabled(true);
          return;
        }
        const data = (await response.json()) as {
          canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] } | null;
        };
        if (cancelled) return;

        if (data.canvas && nodes.length === 0 && edges.length === 0) {
          if (data.canvas.nodes.length > 0) {
            onNodesChange(
              data.canvas.nodes.map((item) => ({ type: "add", item })),
            );
          }
          if (data.canvas.edges.length > 0) {
            onEdgesChange(
              data.canvas.edges.map((item) => ({ type: "add", item })),
            );
          }
          requestAnimationFrame(() => {
            reactFlow.fitView({ duration: ZOOM_DURATION_MS });
          });
        }
      } catch (error) {
        console.error("Failed to load saved canvas", error);
      } finally {
        if (!cancelled) setAutosaveEnabled(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const { status: saveStatus } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: autosaveEnabled,
  });

  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  const handleMouseMove = useCallback(
    (event: ReactMouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateMyPresence({ cursor: { x: position.x, y: position.y } });
    },
    [screenToFlowPosition, updateMyPresence],
  );

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  const handleZoomIn = useCallback(() => {
    reactFlow.zoomIn({ duration: ZOOM_DURATION_MS });
  }, [reactFlow]);

  const handleZoomOut = useCallback(() => {
    reactFlow.zoomOut({ duration: ZOOM_DURATION_MS });
  }, [reactFlow]);

  const handleFitView = useCallback(() => {
    reactFlow.fitView({ duration: ZOOM_DURATION_MS });
  }, [reactFlow]);

  useKeyboardShortcuts({ reactFlow, onUndo: undo, onRedo: redo });

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

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      const stamp = Date.now();
      const idFor = (originalId: string) => `${originalId}-${stamp}`;

      const newNodes: CanvasNode[] = template.nodes.map((templateNode) => ({
        ...templateNode,
        id: idFor(templateNode.id),
      }));

      const newEdges: CanvasEdge[] = template.edges.map((templateEdge) => ({
        ...templateEdge,
        id: idFor(templateEdge.id),
        source: idFor(templateEdge.source),
        target: idFor(templateEdge.target),
      }));

      if (nodes.length > 0) {
        onNodesChange(
          nodes.map((existing) => ({ type: "remove", id: existing.id })),
        );
      }
      if (edges.length > 0) {
        onEdgesChange(
          edges.map((existing) => ({ type: "remove", id: existing.id })),
        );
      }

      onNodesChange(newNodes.map((item) => ({ type: "add", item })));
      onEdgesChange(newEdges.map((item) => ({ type: "add", item })));

      requestAnimationFrame(() => {
        reactFlow.fitView({ duration: ZOOM_DURATION_MS });
      });
    },
    [nodes, edges, onNodesChange, onEdgesChange, reactFlow],
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
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <PresenceCursors />
        <AiPresence />
      </ReactFlow>
      <CanvasControls
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
      />
      <ShapePanel />
      <StarterTemplatesModal
        open={isTemplatesOpen}
        onClose={() => onTemplatesClose?.()}
        onImport={handleImportTemplate}
      />
    </div>
  );
}
