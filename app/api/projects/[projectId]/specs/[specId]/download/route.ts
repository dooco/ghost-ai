import { get } from "@vercel/blob";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectForUser } from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string; specId: string }>;
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, specId } = await ctx.params;

  const project = await getProjectForUser(projectId, identity);
  if (!project) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    select: { id: true, projectId: true, filePath: true, createdAt: true },
  });

  if (!spec || spec.projectId !== projectId) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  let markdown: string;
  try {
    const result = await get(spec.filePath, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return Response.json({ error: "Not Found" }, { status: 404 });
    }
    markdown = await new Response(result.stream).text();
  } catch (error) {
    console.error("Failed to load spec from blob", {
      projectId,
      specId,
      message: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "Failed to load spec" }, { status: 500 });
  }

  const filename = `spec-${specId}.md`;

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
