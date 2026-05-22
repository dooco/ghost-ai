import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectForUser } from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;

  const project = await getProjectForUser(projectId, identity);
  if (!project) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  let specs;
  try {
    specs = await prisma.projectSpec.findMany({
      where: { projectId },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to list project specs", { projectId, error });
    return Response.json({ error: "Failed to load specs" }, { status: 500 });
  }

  const items = specs.map((spec: { id: string; createdAt: Date }) => ({
    id: spec.id,
    createdAt: spec.createdAt.toISOString(),
    filename: `spec-${spec.id}.md`,
  }));

  return Response.json({ specs: items });
}
