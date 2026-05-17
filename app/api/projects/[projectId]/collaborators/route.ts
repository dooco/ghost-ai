import { auth, currentUser } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { enrichCollaboratorsWithClerk } from "@/lib/collaborators";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

function readEmail(body: unknown): string | null {
  if (body && typeof body === "object" && "email" in body) {
    const raw = (body as { email?: unknown }).email;
    if (typeof raw === "string") {
      const trimmed = raw.trim().toLowerCase();
      if (EMAIL_REGEX.test(trimmed)) return trimmed;
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

export async function GET(_request: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      collaborators: {
        select: { email: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!project) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  const isOwner = project.ownerId === userId;
  if (!isOwner) {
    const user = await currentUser();
    const userEmail =
      user?.emailAddresses[0]?.emailAddress?.toLowerCase() ?? null;
    const isCollaborator = userEmail
      ? project.collaborators.some(
          (c: { email: string }) => c.email.toLowerCase() === userEmail,
        )
      : false;
    if (!isCollaborator) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const emails = project.collaborators.map((c: { email: string }) => c.email);
  const collaborators = await enrichCollaboratorsWithClerk(emails);

  return Response.json({ collaborators, isOwner });
}

export async function POST(request: NextRequest, ctx: RouteContext) {
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

  const email = readEmail(body);
  if (!email) {
    return Response.json(
      { error: "A valid email is required" },
      { status: 400 },
    );
  }

  const ownership = await requireOwnedProject(projectId, userId);
  if ("error" in ownership) return ownership.error;

  try {
    await prisma.projectCollaborator.create({
      data: { projectId, email },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "Collaborator already invited" },
        { status: 409 },
      );
    }
    console.error("Failed to invite collaborator", {
      projectId,
      email,
      error,
    });
    return Response.json(
      { error: "Failed to invite collaborator" },
      { status: 500 },
    );
  }

  const [collaborator] = await enrichCollaboratorsWithClerk([email]);
  return Response.json({ collaborator }, { status: 201 });
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;
  const url = new URL(request.url);
  const rawEmail = url.searchParams.get("email")?.trim().toLowerCase();
  if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
    return Response.json(
      { error: "A valid email is required" },
      { status: 400 },
    );
  }

  const ownership = await requireOwnedProject(projectId, userId);
  if ("error" in ownership) return ownership.error;

  try {
    await prisma.projectCollaborator.delete({
      where: { projectId_email: { projectId, email: rawEmail } },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json(
        { error: "Collaborator not found" },
        { status: 404 },
      );
    }
    console.error("Failed to remove collaborator", {
      projectId,
      email: rawEmail,
      error,
    });
    return Response.json(
      { error: "Failed to remove collaborator" },
      { status: 500 },
    );
  }

  return new Response(null, { status: 204 });
}
