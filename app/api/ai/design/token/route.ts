import { auth as triggerAuth } from "@trigger.dev/sdk";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";

interface TokenInput {
  runId: string;
}

function readInput(body: unknown): TokenInput | null {
  if (!body || typeof body !== "object") return null;
  const candidate = body as { runId?: unknown };
  const runId =
    typeof candidate.runId === "string" ? candidate.runId.trim() : "";
  if (!runId) return null;
  return { runId };
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
    return Response.json({ error: "runId is required" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId: input.runId },
    select: { runId: true, userId: true },
  });

  if (!taskRun || taskRun.userId !== identity.userId) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  let token: string;
  try {
    token = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [taskRun.runId],
        },
      },
      expirationTime: "1h",
    });
  } catch (error) {
    console.error("Failed to create Trigger.dev public token", {
      runId: taskRun.runId,
      error,
    });
    return Response.json({ error: "Failed to create token" }, { status: 500 });
  }

  return Response.json({ token });
}
