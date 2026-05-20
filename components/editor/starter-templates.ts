import { MarkerType } from "@xyflow/react";

import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeShape,
  NODE_SHAPE_DEFAULT_SIZES,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface NodeSpec {
  id: string;
  x: number;
  y: number;
  label: string;
  shape: CanvasNodeShape;
  color: CanvasNodeColor;
}

interface EdgeSpec {
  id: string;
  source: string;
  target: string;
  sourceHandle?: "top" | "right" | "bottom" | "left";
  targetHandle?: "top" | "right" | "bottom" | "left";
  label?: string;
}

const ARROW_MARKER = {
  type: MarkerType.ArrowClosed,
  color: "var(--text-secondary)",
  width: 18,
  height: 18,
} as const;

function node(spec: NodeSpec): CanvasNode {
  const size = NODE_SHAPE_DEFAULT_SIZES[spec.shape];
  return {
    id: spec.id,
    type: CANVAS_NODE_TYPE,
    position: { x: spec.x, y: spec.y },
    style: { width: size.width, height: size.height },
    data: {
      label: spec.label,
      shape: spec.shape,
      color: spec.color,
    },
  };
}

function edge(spec: EdgeSpec): CanvasEdge {
  return {
    id: spec.id,
    source: spec.source,
    target: spec.target,
    sourceHandle: spec.sourceHandle,
    targetHandle: spec.targetHandle,
    type: CANVAS_EDGE_TYPE,
    markerEnd: ARROW_MARKER,
    data: spec.label ? { label: spec.label } : undefined,
  };
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices Architecture",
  description:
    "API gateway fronting auth, user, order, and payment services with their datastores.",
  nodes: [
    node({
      id: "client",
      x: 360,
      y: 0,
      label: "Client App",
      shape: "rectangle",
      color: "blue",
    }),
    node({
      id: "gateway",
      x: 360,
      y: 140,
      label: "API Gateway",
      shape: "pill",
      color: "purple",
    }),
    node({
      id: "auth",
      x: 60,
      y: 280,
      label: "Auth Service",
      shape: "rectangle",
      color: "green",
    }),
    node({
      id: "user",
      x: 260,
      y: 280,
      label: "User Service",
      shape: "rectangle",
      color: "green",
    }),
    node({
      id: "order",
      x: 460,
      y: 280,
      label: "Order Service",
      shape: "rectangle",
      color: "green",
    }),
    node({
      id: "payment",
      x: 660,
      y: 280,
      label: "Payment Service",
      shape: "rectangle",
      color: "green",
    }),
    node({
      id: "user-db",
      x: 280,
      y: 440,
      label: "User DB",
      shape: "cylinder",
      color: "teal",
    }),
    node({
      id: "order-db",
      x: 480,
      y: 440,
      label: "Order DB",
      shape: "cylinder",
      color: "teal",
    }),
    node({
      id: "payment-ext",
      x: 680,
      y: 440,
      label: "Stripe",
      shape: "hexagon",
      color: "orange",
    }),
  ],
  edges: [
    edge({
      id: "client-gateway",
      source: "client",
      target: "gateway",
      sourceHandle: "bottom",
      targetHandle: "top",
    }),
    edge({
      id: "gateway-auth",
      source: "gateway",
      target: "auth",
      sourceHandle: "bottom",
      targetHandle: "top",
    }),
    edge({
      id: "gateway-user",
      source: "gateway",
      target: "user",
      sourceHandle: "bottom",
      targetHandle: "top",
    }),
    edge({
      id: "gateway-order",
      source: "gateway",
      target: "order",
      sourceHandle: "bottom",
      targetHandle: "top",
    }),
    edge({
      id: "gateway-payment",
      source: "gateway",
      target: "payment",
      sourceHandle: "bottom",
      targetHandle: "top",
    }),
    edge({
      id: "user-userdb",
      source: "user",
      target: "user-db",
      sourceHandle: "bottom",
      targetHandle: "top",
    }),
    edge({
      id: "order-orderdb",
      source: "order",
      target: "order-db",
      sourceHandle: "bottom",
      targetHandle: "top",
    }),
    edge({
      id: "payment-ext",
      source: "payment",
      target: "payment-ext",
      sourceHandle: "bottom",
      targetHandle: "top",
    }),
  ],
};

const cicd: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description:
    "A linear pipeline from source commit through build, test, and staged deploys to production.",
  nodes: [
    node({
      id: "source",
      x: 0,
      y: 80,
      label: "Source",
      shape: "circle",
      color: "blue",
    }),
    node({
      id: "build",
      x: 180,
      y: 90,
      label: "Build",
      shape: "rectangle",
      color: "purple",
    }),
    node({
      id: "test",
      x: 400,
      y: 90,
      label: "Test",
      shape: "rectangle",
      color: "orange",
    }),
    node({
      id: "review",
      x: 400,
      y: 240,
      label: "Code Review",
      shape: "rectangle",
      color: "pink",
    }),
    node({
      id: "stage",
      x: 620,
      y: 90,
      label: "Deploy Staging",
      shape: "rectangle",
      color: "teal",
    }),
    node({
      id: "production",
      x: 860,
      y: 90,
      label: "Production",
      shape: "diamond",
      color: "green",
    }),
    node({
      id: "artifacts",
      x: 180,
      y: 240,
      label: "Artifacts",
      shape: "cylinder",
      color: "neutral",
    }),
  ],
  edges: [
    edge({
      id: "source-build",
      source: "source",
      target: "build",
      sourceHandle: "right",
      targetHandle: "left",
    }),
    edge({
      id: "build-test",
      source: "build",
      target: "test",
      sourceHandle: "right",
      targetHandle: "left",
    }),
    edge({
      id: "test-stage",
      source: "test",
      target: "stage",
      sourceHandle: "right",
      targetHandle: "left",
      label: "passes",
    }),
    edge({
      id: "stage-prod",
      source: "stage",
      target: "production",
      sourceHandle: "right",
      targetHandle: "left",
      label: "approve",
    }),
    edge({
      id: "build-artifacts",
      source: "build",
      target: "artifacts",
      sourceHandle: "bottom",
      targetHandle: "top",
    }),
    edge({
      id: "source-review",
      source: "source",
      target: "review",
      sourceHandle: "bottom",
      targetHandle: "left",
    }),
    edge({
      id: "review-test",
      source: "review",
      target: "test",
      sourceHandle: "top",
      targetHandle: "bottom",
    }),
  ],
};

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description:
    "A producer publishes events to a bus where multiple consumers fan out to downstream services.",
  nodes: [
    node({
      id: "producer",
      x: 0,
      y: 200,
      label: "Producer",
      shape: "rectangle",
      color: "blue",
    }),
    node({
      id: "bus",
      x: 240,
      y: 195,
      label: "Event Bus",
      shape: "cylinder",
      color: "purple",
    }),
    node({
      id: "order-worker",
      x: 480,
      y: 40,
      label: "Order Worker",
      shape: "rectangle",
      color: "green",
    }),
    node({
      id: "email-worker",
      x: 480,
      y: 200,
      label: "Email Worker",
      shape: "rectangle",
      color: "orange",
    }),
    node({
      id: "analytics-worker",
      x: 480,
      y: 340,
      label: "Analytics Worker",
      shape: "rectangle",
      color: "pink",
    }),
    node({
      id: "orders-db",
      x: 720,
      y: 40,
      label: "Orders DB",
      shape: "cylinder",
      color: "teal",
    }),
    node({
      id: "smtp",
      x: 720,
      y: 210,
      label: "SMTP",
      shape: "hexagon",
      color: "orange",
    }),
    node({
      id: "warehouse",
      x: 720,
      y: 340,
      label: "Warehouse",
      shape: "cylinder",
      color: "teal",
    }),
  ],
  edges: [
    edge({
      id: "producer-bus",
      source: "producer",
      target: "bus",
      sourceHandle: "right",
      targetHandle: "left",
      label: "publish",
    }),
    edge({
      id: "bus-order",
      source: "bus",
      target: "order-worker",
      sourceHandle: "right",
      targetHandle: "left",
    }),
    edge({
      id: "bus-email",
      source: "bus",
      target: "email-worker",
      sourceHandle: "right",
      targetHandle: "left",
    }),
    edge({
      id: "bus-analytics",
      source: "bus",
      target: "analytics-worker",
      sourceHandle: "right",
      targetHandle: "left",
    }),
    edge({
      id: "order-orders-db",
      source: "order-worker",
      target: "orders-db",
      sourceHandle: "right",
      targetHandle: "left",
    }),
    edge({
      id: "email-smtp",
      source: "email-worker",
      target: "smtp",
      sourceHandle: "right",
      targetHandle: "left",
    }),
    edge({
      id: "analytics-warehouse",
      source: "analytics-worker",
      target: "warehouse",
      sourceHandle: "right",
      targetHandle: "left",
    }),
  ],
};

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  microservices,
  cicd,
  eventDriven,
];
