import { EditorWorkspaceShell } from "@/components/editor/editor-workspace-shell";
import { getProjectsForCurrentUser } from "@/lib/projects";

export default async function EditorPage() {
  const { owned, shared } = await getProjectsForCurrentUser();
  return <EditorWorkspaceShell ownedProjects={owned} sharedProjects={shared} />;
}
