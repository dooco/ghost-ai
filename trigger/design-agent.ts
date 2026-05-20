import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, jsonSchema } from "ai";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { MarkerType } from "@xyflow/react";

import { getLiveblocksClient } from "@/lib/liveblocks";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  NODE_SHAPE_DEFAULT_SIZES,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeShape,
} from "@/types/canvas";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

type DesignAction =
  | {
      type: "add_node";
      id: string;
      label: string;
      shape: CanvasNodeShape;
      color: CanvasNodeColor;
      x: number;
      y: number;
      width?: number;
      height?: number;
    }
  | { type: "move_node"; id: string; x: number; y: number }
  | { type: "resize_node"; id: string; width: number; height: number }
  | {
      type: "update_node_data";
      id: string;
      label?: string;
      color?: CanvasNodeColor;
      shape?: CanvasNodeShape;
    }
  | { type: "delete_node"; id: string }
  | {
      type: "add_edge";
      id: string;
      source: string;
      target: string;
      label?: string;
    }
  | { type: "delete_edge"; id: string };

interface DesignPlan {
  summary: string;
  actions: DesignAction[];
}

const VALID_COLORS = NODE_COLORS.map((c) => c.id);
const VALID_SHAPES = NODE_SHAPES;

const designPlanSchema = jsonSchema<DesignPlan>({
  type: "object",
  required: ["summary", "actions"],
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
      description:
        "A one or two sentence description of the design being produced.",
    },
    actions: {
      type: "array",
      description:
        "An ordered list of mutations to apply to the collaborative canvas.",
      items: {
        type: "object",
        required: ["type"],
        properties: {
          type: {
            type: "string",
            enum: [
              "add_node",
              "move_node",
              "resize_node",
              "update_node_data",
              "delete_node",
              "add_edge",
              "delete_edge",
            ],
          },
          id: { type: "string" },
          label: { type: "string" },
          shape: { type: "string", enum: [...VALID_SHAPES] },
          color: { type: "string", enum: [...VALID_COLORS] },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" },
          source: { type: "string" },
          target: { type: "string" },
        },
      },
    },
  },
});

const SYSTEM_PROMPT = `You are Ghost AI, a system-architecture design agent that produces collaborative canvas edits.

Output a JSON object describing the design as an ordered list of canvas mutations.

NODE SHAPES (use the right shape for the concept):
- rectangle: general-purpose service or component (default)
- diamond: decision point or gateway
- circle: event or endpoint
- pill: process or worker
- cylinder: database or persistent storage
- hexagon: external system or boundary

NODE COLORS (use sparingly to group related concepts):
- neutral (default), blue, purple, orange, red, pink, green, teal

LAYOUT RULES:
- Place nodes on a logical left-to-right or top-to-bottom flow.
- Use a grid roughly 240px horizontal and 160px vertical between node centers.
- Keep the design centered around (0,0). Typical canvas spans -600 to 600 on each axis.
- Avoid overlapping nodes.
- For "add_node", always provide x, y; omit width/height to use shape defaults.

EDGE RULES:
- Connect nodes only with valid source/target IDs that already exist (either previously in the canvas or added earlier in your own actions).
- Give every edge a stable id like "e-<source>-<target>".
- Add a short edge label only when it clarifies the relationship.

When extending an existing canvas, prefer additive actions (add_node, add_edge) and only delete or modify nodes/edges when the prompt explicitly asks for it.

Limit yourself to at most 20 actions per response.`;

function clampPosition(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(-2000, Math.min(2000, value));
}

function clampDimension(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(40, Math.min(600, value));
}

function safeShape(value: unknown): CanvasNodeShape {
  return (VALID_SHAPES as readonly string[]).includes(value as string)
    ? (value as CanvasNodeShape)
    : "rectangle";
}

function safeColor(value: unknown): CanvasNodeColor {
  return (VALID_COLORS as readonly string[]).includes(value as string)
    ? (value as CanvasNodeColor)
    : DEFAULT_NODE_COLOR;
}

function buildAddNodePayload(
  action: Extract<DesignAction, { type: "add_node" }>,
) {
  const shape = safeShape(action.shape);
  const defaults = NODE_SHAPE_DEFAULT_SIZES[shape];
  const width = clampDimension(action.width, defaults.width);
  const height = clampDimension(action.height, defaults.height);
  const node: CanvasNode = {
    id: String(action.id),
    type: CANVAS_NODE_TYPE,
    position: {
      x: clampPosition(action.x, 0) - width / 2,
      y: clampPosition(action.y, 0) - height / 2,
    },
    style: { width, height },
    width,
    height,
    data: {
      label: String(action.label ?? "").slice(0, 80),
      color: safeColor(action.color),
      shape,
    },
  };
  return node;
}

function buildAddEdgePayload(
  action: Extract<DesignAction, { type: "add_edge" }>,
): CanvasEdge {
  return {
    id: String(action.id),
    type: CANVAS_EDGE_TYPE,
    source: String(action.source),
    target: String(action.target),
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "var(--text-secondary)",
      width: 18,
      height: 18,
    },
    data: action.label ? { label: String(action.label).slice(0, 60) } : {},
  };
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: DesignAgentPayload) => {
    const { prompt, roomId } = payload;

    metadata
      .set("status", "starting")
      .set("phase", "starting")
      .set("nodesAdded", 0)
      .set("edgesAdded", 0)
      .append("logs", "AI design agent received prompt");

    const liveblocks = getLiveblocksClient();

    async function safeBroadcast(
      event:
        | { kind: "ai:start"; status: string }
        | { kind: "ai:status"; status: string; message?: string }
        | { kind: "ai:cursor"; cursor: { x: number; y: number } | null }
        | { kind: "ai:thinking"; thinking: boolean }
        | {
            kind: "ai:complete";
            status: string;
            nodesAdded: number;
            edgesAdded: number;
          }
        | { kind: "ai:error"; message: string },
    ) {
      try {
        await liveblocks.broadcastEvent(roomId, event);
      } catch (error) {
        logger.warn("Failed to broadcast Liveblocks event", {
          roomId,
          kind: event.kind,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await safeBroadcast({ kind: "ai:start", status: "Reading your prompt" });
    await safeBroadcast({ kind: "ai:thinking", thinking: true });
    await safeBroadcast({
      kind: "ai:status",
      status: "thinking",
      message: "Designing your system…",
    });
    metadata.set("status", "thinking").set("phase", "planning");

    let existingNodes: readonly CanvasNode[] = [];
    let existingEdges: readonly CanvasEdge[] = [];
    try {
      await mutateFlow<CanvasNode, CanvasEdge>(
        { client: liveblocks, roomId },
        (flow) => {
          existingNodes = flow.nodes;
          existingEdges = flow.edges;
        },
      );
    } catch (error) {
      logger.warn("Failed to read canvas state from Liveblocks", {
        roomId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const canvasSummary = {
      nodes: existingNodes.map((node) => ({
        id: node.id,
        label: node.data?.label ?? "",
        shape: node.data?.shape ?? "rectangle",
        color: node.data?.color ?? DEFAULT_NODE_COLOR,
        x: node.position.x,
        y: node.position.y,
      })),
      edges: existingEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.data?.label ?? "",
      })),
    };

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      await safeBroadcast({ kind: "ai:thinking", thinking: false });
      await safeBroadcast({
        kind: "ai:error",
        message: "GOOGLE_AI_API_KEY is not configured",
      });
      metadata
        .set("status", "error")
        .append("logs", "Missing GOOGLE_AI_API_KEY");
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const google = createGoogleGenerativeAI({ apiKey });

    let plan: DesignPlan;
    try {
      const result = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: designPlanSchema,
        system: SYSTEM_PROMPT,
        prompt: [
          `User prompt: ${prompt}`,
          `Existing canvas state: ${JSON.stringify(canvasSummary)}`,
        ].join("\n\n"),
      });
      plan = result.object;
    } catch (error) {
      logger.error("Gemini design plan generation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      await safeBroadcast({ kind: "ai:thinking", thinking: false });
      await safeBroadcast({
        kind: "ai:error",
        message: "Failed to generate design plan",
      });
      metadata
        .set("status", "error")
        .append(
          "logs",
          `Gemini error: ${error instanceof Error ? error.message : "unknown"}`,
        );
      throw error;
    }

    const actions = Array.isArray(plan.actions)
      ? plan.actions.slice(0, 20)
      : [];

    metadata
      .set("status", "applying")
      .set("phase", "applying")
      .set("totalActions", actions.length)
      .append(
        "logs",
        plan.summary
          ? `Plan: ${plan.summary}`
          : `Plan with ${actions.length} actions`,
      );

    await safeBroadcast({
      kind: "ai:status",
      status: "applying",
      message: plan.summary ?? `Applying ${actions.length} canvas updates`,
    });

    let nodesAdded = 0;
    let edgesAdded = 0;

    try {
      await mutateFlow<CanvasNode, CanvasEdge>(
        { client: liveblocks, roomId },
        async (flow) => {
          for (const [index, action] of actions.entries()) {
            metadata
              .set("currentAction", index + 1)
              .set("currentActionType", action.type);

            switch (action.type) {
              case "add_node": {
                const node = buildAddNodePayload(action);
                await safeBroadcast({
                  kind: "ai:cursor",
                  cursor: {
                    x: node.position.x + (node.width ?? 0) / 2,
                    y: node.position.y + (node.height ?? 0) / 2,
                  },
                });
                flow.addNode(node);
                nodesAdded += 1;
                break;
              }
              case "move_node": {
                const x = clampPosition(action.x, 0);
                const y = clampPosition(action.y, 0);
                flow.updateNode(String(action.id), (existing) => ({
                  ...existing,
                  position: { x, y },
                }));
                await safeBroadcast({
                  kind: "ai:cursor",
                  cursor: { x, y },
                });
                break;
              }
              case "resize_node": {
                const width = clampDimension(action.width, 160);
                const height = clampDimension(action.height, 80);
                flow.updateNode(String(action.id), (existing) => ({
                  ...existing,
                  width,
                  height,
                  style: { ...(existing.style ?? {}), width, height },
                }));
                break;
              }
              case "update_node_data": {
                flow.updateNodeData(String(action.id), (data) => ({
                  ...data,
                  ...(action.label !== undefined
                    ? { label: String(action.label).slice(0, 80) }
                    : {}),
                  ...(action.color !== undefined
                    ? { color: safeColor(action.color) }
                    : {}),
                  ...(action.shape !== undefined
                    ? { shape: safeShape(action.shape) }
                    : {}),
                }));
                break;
              }
              case "delete_node": {
                flow.removeNode(String(action.id));
                break;
              }
              case "add_edge": {
                const edge = buildAddEdgePayload(action);
                flow.addEdge(edge);
                edgesAdded += 1;
                break;
              }
              case "delete_edge": {
                flow.removeEdge(String(action.id));
                break;
              }
            }

            metadata
              .set("nodesAdded", nodesAdded)
              .set("edgesAdded", edgesAdded);
          }
        },
      );
    } catch (error) {
      logger.error("Failed to apply design plan to canvas", {
        roomId,
        error: error instanceof Error ? error.message : String(error),
      });
      await safeBroadcast({ kind: "ai:thinking", thinking: false });
      await safeBroadcast({ kind: "ai:cursor", cursor: null });
      await safeBroadcast({
        kind: "ai:error",
        message: "Failed to apply design to canvas",
      });
      metadata
        .set("status", "error")
        .append(
          "logs",
          `Apply error: ${error instanceof Error ? error.message : "unknown"}`,
        );
      throw error;
    }

    await safeBroadcast({ kind: "ai:cursor", cursor: null });
    await safeBroadcast({ kind: "ai:thinking", thinking: false });
    await safeBroadcast({
      kind: "ai:complete",
      status: "complete",
      nodesAdded,
      edgesAdded,
    });

    metadata
      .set("status", "complete")
      .set("phase", "complete")
      .set("summary", plan.summary ?? "")
      .append(
        "logs",
        `Done — added ${nodesAdded} nodes and ${edgesAdded} edges`,
      );

    return {
      summary: plan.summary ?? "",
      nodesAdded,
      edgesAdded,
      roomId,
    };
  },
});
