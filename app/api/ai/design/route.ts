import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectForUser } from "@/lib/project-access";
import type { designAgentTask } from "@/trigger/design-agent";

interface DesignTriggerInput {
  prompt: string;
  roomId: string;
  projectId: string;
}

function readInput(body: unknown): DesignTriggerInput | null {
  if (!body || typeof body !== "object") return null;
  const candidate = body as {
    prompt?: unknown;
    roomId?: unknown;
    projectId?: unknown;
  };
  const prompt =
    typeof candidate.prompt === "string" ? candidate.prompt.trim() : "";
  const roomId =
    typeof candidate.roomId === "string" ? candidate.roomId.trim() : "";
  const projectId =
    typeof candidate.projectId === "string" ? candidate.projectId.trim() : "";
  if (!prompt || !roomId || !projectId) return null;
  return { prompt, roomId, projectId };
}

export async function POST(request: NextRequest) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const input = readInput(body);
  if (!input) {
    return Response.json(
      { error: "prompt, roomId, and projectId are required" },
      { status: 400 },
    );
  }

  const project = await getProjectForUser(input.projectId, identity);
  if (!project) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  let handle;
  try {
    handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt: input.prompt,
      roomId: input.roomId,
    });
  } catch (error) {
    console.error("Failed to trigger design-agent task", {
      projectId: input.projectId,
      error,
    });
    return Response.json(
      { error: "Failed to trigger design task" },
      { status: 500 },
    );
  }

  try {
    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: input.projectId,
        userId: identity.userId,
      },
    });
  } catch (error) {
    console.error("Failed to persist TaskRun", {
      projectId: input.projectId,
      runId: handle.id,
      error,
    });
    return Response.json(
      { error: "Failed to record design task" },
      { status: 500 },
    );
  }

  let publicToken: string;
  try {
    publicToken = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [handle.id],
        },
      },
      expirationTime: "1h",
    });
  } catch (error) {
    console.error("Failed to create Trigger.dev public token", {
      projectId: input.projectId,
      runId: handle.id,
      error,
    });
    return Response.json(
      { error: "Failed to create realtime token" },
      { status: 500 },
    );
  }

  return Response.json({ runId: handle.id, publicToken });
}
