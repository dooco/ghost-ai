import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_PROJECT_NAME = "Untitled Project";

function readName(body: unknown): string {
  if (body && typeof body === "object" && "name" in body) {
    const raw = (body as { name?: unknown }).name;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return DEFAULT_PROJECT_NAME;
}

function readId(body: unknown): string | null {
  if (body && typeof body === "object" && "id" in body) {
    const raw = (body as { id?: unknown }).id;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return null;
}

function handleListProjectsError(userId: string, error: unknown) {
  console.error("Failed to list projects", { userId, error });
  return Response.json({ error: "Failed to load projects" }, { status: 500 });
}

function handleCreateProjectError(
  userId: string,
  id: string | null,
  error: unknown,
) {
  console.error("Failed to create project", { userId, id, error });

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return Response.json(
      { error: "A project with this id already exists" },
      { status: 409 },
    );
  }

  return Response.json({ error: "Failed to create project" }, { status: 500 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let projects;
  try {
    projects = await prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    return handleListProjectsError(userId, error);
  }

  return Response.json({ projects });
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const name = readName(body);
  const id = readId(body);

  let project;
  try {
    project = await prisma.project.create({
      data: id ? { id, ownerId: userId, name } : { ownerId: userId, name },
    });
  } catch (error) {
    return handleCreateProjectError(userId, id, error);
  }

  return Response.json({ project }, { status: 201 });
}
