import type { Edge, Node } from "@xyflow/react";

export const CANVAS_NODE_TYPE = "canvasNode" as const;
export const CANVAS_EDGE_TYPE = "canvasEdge" as const;

export const NODE_COLORS = [
  { id: "neutral", fill: "#1F1F1F", text: "#EDEDED" },
  { id: "blue", fill: "#10233D", text: "#52A8FF" },
  { id: "purple", fill: "#2E1938", text: "#BF7AF0" },
  { id: "orange", fill: "#331B00", text: "#FF990A" },
  { id: "red", fill: "#3C1618", text: "#FF6166" },
  { id: "pink", fill: "#3A1726", text: "#F75F8F" },
  { id: "green", fill: "#0F2E18", text: "#62C073" },
  { id: "teal", fill: "#062822", text: "#0AC7B4" },
] as const;

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type CanvasNodeColor = (typeof NODE_COLORS)[number]["id"];
export type CanvasNodeShape = (typeof NODE_SHAPES)[number];

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: CanvasNodeColor;
  shape: CanvasNodeShape;
}

export type CanvasNode = Node<CanvasNodeData, typeof CANVAS_NODE_TYPE>;

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string;
}

export type CanvasEdge = Edge<CanvasEdgeData, typeof CANVAS_EDGE_TYPE>;

export const DEFAULT_NODE_COLOR: CanvasNodeColor = "neutral";

export interface CanvasNodeSize {
  width: number;
  height: number;
}

export const NODE_SHAPE_DEFAULT_SIZES: Record<CanvasNodeShape, CanvasNodeSize> =
  {
    rectangle: { width: 160, height: 80 },
    diamond: { width: 140, height: 140 },
    circle: { width: 100, height: 100 },
    pill: { width: 160, height: 60 },
    cylinder: { width: 120, height: 100 },
    hexagon: { width: 120, height: 110 },
  };

export const CANVAS_DRAG_MIME_TYPE = "application/x-canvas-shape";

export interface CanvasShapeDragPayload {
  shape: CanvasNodeShape;
  width: number;
  height: number;
}
