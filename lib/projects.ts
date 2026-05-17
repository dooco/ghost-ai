import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import type { ProjectSummary } from "@/types/project";

export interface UserProjectLists {
  owned: ProjectSummary[];
  shared: ProjectSummary[];
}

export async function getProjectsForCurrentUser(): Promise<UserProjectLists> {
  const user = await currentUser();
  if (!user) return { owned: [], shared: [] };

  const email = user.emailAddresses[0]?.emailAddress;

  type ProjectRow = { id: string; name: string };

  const ownedPromise: Promise<ProjectRow[]> = prisma.project.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  const sharedPromise: Promise<ProjectRow[]> = email
    ? prisma.project.findMany({
        where: { collaborators: { some: { email } } },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      })
    : Promise.resolve([]);

  const [owned, shared] = await Promise.all([ownedPromise, sharedPromise]);

  return {
    owned: owned.map((p) => ({ ...p, ownership: "owned" as const })),
    shared: shared.map((p) => ({ ...p, ownership: "shared" as const })),
  };
}
