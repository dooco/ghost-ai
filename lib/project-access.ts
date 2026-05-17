import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface ClerkIdentity {
  userId: string;
  email: string | null;
}

export interface AccessibleProject {
  id: string;
  name: string;
  ownerId: string;
}

export async function getCurrentIdentity(): Promise<ClerkIdentity | null> {
  const user = await currentUser();
  if (!user) return null;
  return {
    userId: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? null,
  };
}

export async function getProjectForUser(
  projectId: string,
  identity: ClerkIdentity,
): Promise<AccessibleProject | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      collaborators: { select: { email: true } },
    },
  });
  if (!project) return null;

  const isOwner = project.ownerId === identity.userId;
  const isCollaborator = identity.email
    ? project.collaborators.some(
        (collaborator: { email: string }) =>
          collaborator.email === identity.email,
      )
    : false;

  if (!isOwner && !isCollaborator) return null;

  return { id: project.id, name: project.name, ownerId: project.ownerId };
}
