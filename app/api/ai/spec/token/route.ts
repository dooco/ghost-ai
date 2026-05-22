import { auth as triggerAuth } from "@trigger.dev/sdk";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";

const requestSchema = z.object({
  runId: z.string().min(1),
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
    return Response.json({ error: "runId is required" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId: parsed.data.runId },
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
    console.error("Failed to create Trigger.dev public token for spec run", {
      runId: taskRun.runId,
      error,
    });
    return Response.json({ error: "Failed to create token" }, { status: 500 });
  }

  return Response.json({ token });
}
