export type ProjectOwnership = "owned" | "shared";

export interface ProjectSummary {
  id: string;
  name: string;
  ownership: ProjectOwnership;
}
