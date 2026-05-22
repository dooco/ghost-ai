import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { put } from "@vercel/blob";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { chatMessageSchema } from "@/types/tasks";
import { NODE_COLORS, NODE_SHAPES } from "@/types/canvas";

const VALID_COLORS = NODE_COLORS.map((c) => c.id);

const canvasNodeSchema = z.object({
  id: z.string(),
  data: z
    .object({
      label: z.string().optional(),
      color: z.enum(VALID_COLORS as [string, ...string[]]).optional(),
      shape: z.enum(NODE_SHAPES as unknown as [string, ...string[]]).optional(),
    })
    .passthrough()
    .optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

const canvasEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  data: z
    .object({
      label: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const generateSpecSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema).max(200).default([]),
  nodes: z.array(canvasNodeSchema).max(500).default([]),
  edges: z.array(canvasEdgeSchema).max(1000).default([]),
});

export type GenerateSpecPayload = z.infer<typeof generateSpecSchema>;

const SYSTEM_PROMPT = `You are Ghost AI, a senior system architect that converts a collaborative architecture canvas and the chat that produced it into a clear, well-structured technical specification.

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

function summariseNodesForPrompt(nodes: GenerateSpecPayload["nodes"]): string {
  if (nodes.length === 0) return "(no nodes on canvas)";
  return nodes
    .map((node) => {
      const label = node.data?.label?.trim() || node.id;
      const shape = node.data?.shape ?? "rectangle";
      const color = node.data?.color ?? "neutral";
      return `- ${node.id} | "${label}" | shape=${shape} | color=${color}`;
    })
    .join("\n");
}

function summariseEdgesForPrompt(edges: GenerateSpecPayload["edges"]): string {
  if (edges.length === 0) return "(no edges on canvas)";
  return edges
    .map((edge) => {
      const label = edge.data?.label?.trim();
      return `- ${edge.source} -> ${edge.target}${label ? ` (${label})` : ""}`;
    })
    .join("\n");
}

function summariseChatForPrompt(
  chatHistory: GenerateSpecPayload["chatHistory"],
): string {
  if (chatHistory.length === 0) return "(no prior chat)";
  return chatHistory
    .map(
      (message) =>
        `${message.role.toUpperCase()} (${message.sender}): ${message.content}`,
    )
    .join("\n");
}

export const generateSpecTask = schemaTask({
  id: "generate-spec",
  schema: generateSpecSchema,
  maxDuration: 300,
  retry: {
    maxAttempts: 3,
    factor: 1.8,
    minTimeoutInMs: 1_000,
    maxTimeoutInMs: 30_000,
    randomize: true,
  },
  run: async (payload) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload;

    metadata
      .set("status", "starting")
      .set("phase", "starting")
      .set("projectId", projectId)
      .set("roomId", roomId)
      .set("nodeCount", nodes.length)
      .set("edgeCount", edges.length)
      .append("logs", "Spec generation started");

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      metadata
        .set("status", "error")
        .set("phase", "error")
        .append("logs", "Missing GOOGLE_AI_API_KEY");
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
      summariseChatForPrompt(chatHistory),
    ].join("\n");

    let markdown: string;
    try {
      const result = await generateText({
        model: google("gemini-2.5-flash"),
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });
      markdown = result.text.trim();
    } catch (error) {
      logger.error("Gemini spec generation failed", {
        projectId,
        roomId,
        error: error instanceof Error ? error.message : String(error),
      });
      metadata
        .set("status", "error")
        .set("phase", "error")
        .append(
          "logs",
          `Gemini error: ${error instanceof Error ? error.message : "unknown"}`,
        );
      throw error;
    }

    if (!markdown) {
      metadata
        .set("status", "error")
        .set("phase", "error")
        .append("logs", "Gemini returned empty spec content");
      throw new Error("Gemini returned empty spec content");
    }

    metadata
      .set("status", "persisting")
      .set("phase", "persisting")
      .set("specLength", markdown.length)
      .append("logs", `Generated spec (${markdown.length} chars)`);

    const specId = crypto.randomUUID();
    const blobPath = `specs/${projectId}/${specId}.md`;

    let blobUrl: string;
    try {
      const blob = await put(blobPath, markdown, {
        access: "private",
        contentType: "text/markdown",
        allowOverwrite: false,
        addRandomSuffix: false,
      });
      blobUrl = blob.url;
    } catch (error) {
      logger.error("Failed to upload spec to Vercel Blob", {
        projectId,
        specId,
        message: error instanceof Error ? error.message : String(error),
      });
      metadata
        .set("status", "error")
        .set("phase", "error")
        .append(
          "logs",
          `Blob upload failed: ${
            error instanceof Error ? error.message : "unknown"
          }`,
        );
      throw error;
    }

    let savedSpecId: string;
    try {
      const record = await prisma.projectSpec.create({
        data: {
          id: specId,
          projectId,
          filePath: blobUrl,
        },
        select: { id: true },
      });
      savedSpecId = record.id;
    } catch (error) {
      logger.error("Failed to persist ProjectSpec record", {
        projectId,
        specId,
        message: error instanceof Error ? error.message : String(error),
      });
      metadata
        .set("status", "error")
        .set("phase", "error")
        .append(
          "logs",
          `DB write failed: ${
            error instanceof Error ? error.message : "unknown"
          }`,
        );
      throw error;
    }

    metadata
      .set("status", "complete")
      .set("phase", "complete")
      .set("specId", savedSpecId)
      .set("filePath", blobUrl)
      .append("logs", `Persisted spec ${savedSpecId}`);

    return {
      projectId,
      roomId,
      specId: savedSpecId,
      filePath: blobUrl,
      content: markdown,
    };
  },
});
