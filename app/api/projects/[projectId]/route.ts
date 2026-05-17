import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

import { Prisma } from "@/generated/prisma/client";
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

function handleProjectMutationError(
  action: "update" | "delete",
  error: unknown,
  projectId: string,
) {
  console.error(`Failed to ${action} project`, { projectId, error });

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (error.code === "P2003") {
      return Response.json(
        { error: "Project cannot be deleted while related records exist" },
        { status: 409 },
      );
    }
  }

  return Response.json(
    { error: `Failed to ${action} project` },
    { status: 500 },
  );
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

  let updated;
  try {
    updated = await prisma.project.update({
      where: { id: projectId },
      data: { name },
    });
  } catch (error) {
    return handleProjectMutationError("update", error, projectId);
  }

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

  try {
    await prisma.project.delete({ where: { id: projectId } });
  } catch (error) {
    return handleProjectMutationError("delete", error, projectId);
  }

  return new Response(null, { status: 204 });
}
