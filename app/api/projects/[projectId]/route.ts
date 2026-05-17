import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

function readName(body: unknown): string | null {
  if (body && typeof body === "object" && "name" in body) {
    const raw = (body as { name?: unknown }).name;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return null;
}

async function requireOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return {
      error: Response.json({ error: "Not Found" }, { status: 404 }),
    } as const;
  }

  if (project.ownerId !== userId) {
    return {
      error: Response.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  return { project } as const;
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const name = readName(body);
  if (!name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const ownership = await requireOwnedProject(projectId, userId);
  if ("error" in ownership) {
    return ownership.error;
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name },
  });

  return Response.json({ project: updated });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;

  const ownership = await requireOwnedProject(projectId, userId);
  if ("error" in ownership) {
    return ownership.error;
  }

  await prisma.project.delete({ where: { id: projectId } });

  return new Response(null, { status: 204 });
}
