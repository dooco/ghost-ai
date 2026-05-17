import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { EditorWorkspaceShell } from "@/components/editor/editor-workspace-shell";
import { getCurrentIdentity, getProjectForUser } from "@/lib/project-access";
import { getProjectsForCurrentUser } from "@/lib/projects";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function EditorWorkspacePage({ params }: PageProps) {
  const { roomId } = await params;

  const identity = await getCurrentIdentity();
  if (!identity) redirect("/sign-in");

  const project = await getProjectForUser(roomId, identity);
  if (!project) return <AccessDenied />;

  const { owned, shared } = await getProjectsForCurrentUser();
  const isOwner = project.ownerId === identity.userId;

  return (
    <EditorWorkspaceShell
      ownedProjects={owned}
      sharedProjects={shared}
      activeProjectId={project.id}
      projectName={project.name}
      isOwner={isOwner}
    />
  );
}
