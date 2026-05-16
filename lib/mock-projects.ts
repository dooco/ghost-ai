import type { MockProject } from "@/types/project";

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "mock-1",
    name: "Internal Dashboard",
    slug: "internal-dashboard",
    ownership: "owned",
  },
  {
    id: "mock-2",
    name: "Payments Service",
    slug: "payments-service",
    ownership: "owned",
  },
  {
    id: "mock-3",
    name: "Onboarding Flow",
    slug: "onboarding-flow",
    ownership: "shared",
  },
];
