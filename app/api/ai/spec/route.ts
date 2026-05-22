import { tasks } from "@trigger.dev/sdk";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectForUser } from "@/lib/project-access";
import type { generateSpecTask } from "@/trigger/generate-spec";
import { chatMessageSchema } from "@/types/tasks";

const canvasNodeInputSchema = z
  .object({
    id: z.string().min(1),
  })
  .passthrough();

const canvasEdgeInputSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
  })
  .passthrough();

const requestSchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema).max(200).default([]),
  nodes: z.array(canvasNodeInputSchema).max(500).default([]),
  edges: z.array(canvasEdgeInputSchema).max(1000).default([]),
});

export async function POST(request: NextRequest) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown = null;
  try {
    rawBody = await request.json();
  } catch {
    rawBody = null;
  }

  const parsed = requestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data;

  // roomId doubles as the project ID. Resolve project access from the server-side
  // identity + roomId only; never trust a client-supplied projectId.
  const project = await getProjectForUser(roomId, identity);
  if (!project) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  let handle;
  try {
    handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
      projectId: project.id,
      roomId,
      chatHistory,
      nodes,
      edges,
    });
  } catch (error) {
    console.error("Failed to trigger generate-spec task", {
      projectId: project.id,
      error,
    });
    return Response.json(
      { error: "Failed to trigger spec task" },
      { status: 500 },
    );
  }

  try {
    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: project.id,
        userId: identity.userId,
      },
    });
  } catch (error) {
    console.error("Failed to persist TaskRun for spec", {
      projectId: project.id,
      runId: handle.id,
      error,
    });
    return Response.json(
      { error: "Failed to record spec task" },
      { status: 500 },
    );
  }

  return Response.json({ runId: handle.id });
}
