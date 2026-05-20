import { get, put } from "@vercel/blob";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectForUser } from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

interface CanvasPayload {
  nodes: unknown[];
  edges: unknown[];
}

function readCanvas(body: unknown): CanvasPayload | null {
  if (!body || typeof body !== "object") return null;
  const candidate = body as { nodes?: unknown; edges?: unknown };
  if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) {
    return null;
  }
  return { nodes: candidate.nodes, edges: candidate.edges };
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;

  const project = await getProjectForUser(projectId, identity);
  if (!project) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const canvas = readCanvas(body);
  if (!canvas) {
    return Response.json(
      { error: "nodes and edges arrays are required" },
      { status: 400 },
    );
  }

  try {
    const blob = await put(`canvas/${projectId}.json`, JSON.stringify(canvas), {
      access: "private",
      contentType: "application/json",
      allowOverwrite: true,
      addRandomSuffix: false,
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    });

    return Response.json({ url: blob.url });
  } catch (error) {
    console.error("Failed to save canvas", {
      projectId,
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "Failed to save canvas" }, { status: 500 });
  }
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;

  const access = await getProjectForUser(projectId, identity);
  if (!access) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!project?.canvasJsonPath) {
    return Response.json({ canvas: null });
  }

  try {
    const result = await get(project.canvasJsonPath, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return Response.json({ canvas: null });
    }
    const text = await new Response(result.stream).text();
    const canvas = JSON.parse(text) as CanvasPayload;
    return Response.json({ canvas });
  } catch (error) {
    console.error("Failed to load canvas", {
      projectId,
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "Failed to load canvas" }, { status: 500 });
  }
}
