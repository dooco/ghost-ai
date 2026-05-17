import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import { EditorWorkspaceShell } from "@/components/editor/editor-workspace-shell";
import { prisma } from "@/lib/prisma";
import { getProjectsForCurrentUser } from "@/lib/projects";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function EditorWorkspacePage({ params }: PageProps) {
  const { projectId } = await params;
  const user = await currentUser();
  const userId = user?.id;
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  if (!userId) notFound();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      collaborators: {
        select: { email: true },
      },
    },
  });

  const isCollaborator = userEmail
    ? project?.collaborators.some((collaborator) => collaborator.email === userEmail)
    : false;

  if (!project || (project.ownerId !== userId && !isCollaborator)) notFound();

  const { owned, shared } = await getProjectsForCurrentUser();
  return (
    <EditorWorkspaceShell
      ownedProjects={owned}
      sharedProjects={shared}
      activeProjectId={projectId}
    />
  );
}
