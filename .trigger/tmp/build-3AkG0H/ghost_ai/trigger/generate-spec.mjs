import {
  NODE_COLORS,
  NODE_SHAPES,
  createGoogleGenerativeAI,
  external_exports,
  generateText
} from "../../chunk-XPGYALAP.mjs";
import "../../chunk-5HLUDUNX.mjs";
import {
  logger,
  metadata,
  schemaTask
} from "../../chunk-5MMSPSD6.mjs";
import "../../chunk-RA6RHLTU.mjs";
import {
  __name,
  init_esm
} from "../../chunk-NKKWNCEX.mjs";

// trigger/generate-spec.ts
init_esm();

// types/tasks.ts
init_esm();
var chatMessageSchema = external_exports.object({
  id: external_exports.string().min(1),
  sender: external_exports.string().min(1).max(120),
  role: external_exports.enum(["user", "ai"]),
  content: external_exports.string().min(1).max(2e3),
  timestamp: external_exports.number().int().nonnegative()
});

// trigger/generate-spec.ts
var VALID_COLORS = NODE_COLORS.map((c) => c.id);
var canvasNodeSchema = external_exports.object({
  id: external_exports.string(),
  data: external_exports.object({
    label: external_exports.string().optional(),
    color: external_exports.enum(VALID_COLORS).optional(),
    shape: external_exports.enum(NODE_SHAPES).optional()
  }).passthrough().optional(),
  position: external_exports.object({
    x: external_exports.number(),
    y: external_exports.number()
  }).optional()
});
var canvasEdgeSchema = external_exports.object({
  id: external_exports.string(),
  source: external_exports.string(),
  target: external_exports.string(),
  data: external_exports.object({
    label: external_exports.string().optional()
  }).passthrough().optional()
});
var generateSpecSchema = external_exports.object({
  projectId: external_exports.string().min(1),
  roomId: external_exports.string().min(1),
  chatHistory: external_exports.array(chatMessageSchema).max(200).default([]),
  nodes: external_exports.array(canvasNodeSchema).max(500).default([]),
  edges: external_exports.array(canvasEdgeSchema).max(1e3).default([])
});
var SYSTEM_PROMPT = `You are Ghost AI, a senior system architect that converts a collaborative architecture canvas and the chat that produced it into a clear, well-structured technical specification.

Output GitHub-flavored Markdown only. Do not wrap the response in a code fence.

Structure the spec using these top-level sections (omit a section if there is genuinely nothing to say about it):

# {Project / System Name}
## Overview
## Goals
## Architecture
### Components
### Data Flow
## Interfaces
## Data Model
## Operational Concerns
## Open Questions

Guidelines:
- Ground every claim in the supplied nodes, edges, and chat history. Do not invent components that are not on the canvas.
- For each node, describe its responsibility and how it connects to its neighbours.
- Use edge labels (when present) to explain relationships between components.
- Prefer bullet lists for components and short paragraphs for narrative sections.
- Keep the tone direct, factual, and implementation-oriented.
- If the canvas is sparse, say so plainly under "Open Questions" rather than padding with filler.`;
function summariseNodesForPrompt(nodes) {
  if (nodes.length === 0) return "(no nodes on canvas)";
  return nodes.map((node) => {
    const label = node.data?.label?.trim() || node.id;
    const shape = node.data?.shape ?? "rectangle";
    const color = node.data?.color ?? "neutral";
    return `- ${node.id} | "${label}" | shape=${shape} | color=${color}`;
  }).join("\n");
}
__name(summariseNodesForPrompt, "summariseNodesForPrompt");
function summariseEdgesForPrompt(edges) {
  if (edges.length === 0) return "(no edges on canvas)";
  return edges.map((edge) => {
    const label = edge.data?.label?.trim();
    return `- ${edge.source} -> ${edge.target}${label ? ` (${label})` : ""}`;
  }).join("\n");
}
__name(summariseEdgesForPrompt, "summariseEdgesForPrompt");
function summariseChatForPrompt(chatHistory) {
  if (chatHistory.length === 0) return "(no prior chat)";
  return chatHistory.map(
    (message) => `${message.role.toUpperCase()} (${message.sender}): ${message.content}`
  ).join("\n");
}
__name(summariseChatForPrompt, "summariseChatForPrompt");
var generateSpecTask = schemaTask({
  id: "generate-spec",
  schema: generateSpecSchema,
  maxDuration: 300,
  retry: {
    maxAttempts: 3,
    factor: 1.8,
    minTimeoutInMs: 1e3,
    maxTimeoutInMs: 3e4,
    randomize: true
  },
  run: /* @__PURE__ */ __name(async (payload) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload;
    metadata.set("status", "starting").set("phase", "starting").set("projectId", projectId).set("roomId", roomId).set("nodeCount", nodes.length).set("edgeCount", edges.length).append("logs", "Spec generation started");
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      metadata.set("status", "error").set("phase", "error").append("logs", "Missing GOOGLE_AI_API_KEY");
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }
    const google = createGoogleGenerativeAI({ apiKey });
    metadata.set("status", "generating").set("phase", "generating");
    const userPrompt = [
      `Project ID: ${projectId}`,
      `Room ID: ${roomId}`,
      "",
      "Canvas nodes:",
      summariseNodesForPrompt(nodes),
      "",
      "Canvas edges:",
      summariseEdgesForPrompt(edges),
      "",
      "Chat history:",
      summariseChatForPrompt(chatHistory)
    ].join("\n");
    let markdown;
    try {
      const result = await generateText({
        model: google("gemini-2.5-flash"),
        system: SYSTEM_PROMPT,
        prompt: userPrompt
      });
      markdown = result.text.trim();
    } catch (error) {
      logger.error("Gemini spec generation failed", {
        projectId,
        roomId,
        error: error instanceof Error ? error.message : String(error)
      });
      metadata.set("status", "error").set("phase", "error").append(
        "logs",
        `Gemini error: ${error instanceof Error ? error.message : "unknown"}`
      );
      throw error;
    }
    if (!markdown) {
      metadata.set("status", "error").set("phase", "error").append("logs", "Gemini returned empty spec content");
      throw new Error("Gemini returned empty spec content");
    }
    metadata.set("status", "complete").set("phase", "complete").set("specLength", markdown.length).append("logs", `Generated spec (${markdown.length} chars)`);
    return {
      projectId,
      roomId,
      content: markdown
    };
  }, "run")
});
export {
  generateSpecSchema,
  generateSpecTask
};
//# sourceMappingURL=generate-spec.mjs.map
