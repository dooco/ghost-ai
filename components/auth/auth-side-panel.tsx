import { Sparkles, Users, FileText, Ghost } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Architecture Generation",
    description:
      "Describe your system in prose, and Ghost AI builds the nodes and edges on a live canvas.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export function AuthSidePanel() {
  return (
    <aside className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-bg-auth-panel px-16 py-12">
      <div className="flex items-center gap-2">
        <Ghost className="h-5 w-5 text-brand" strokeWidth={2} />
        <span className="text-sm font-medium text-copy-primary tracking-tight">
          Ghost AI
        </span>
      </div>

      <div className="max-w-md">
        <h1 className="text-4xl font-semibold text-copy-primary tracking-tight leading-tight mb-4">
          Design systems at the speed of thought.
        </h1>
        <p className="text-copy-muted text-sm leading-relaxed mb-12">
          Describe your architecture in plain English. Ghost AI maps it to a
          shared canvas where your team can refine in real time.
        </p>

        <ul className="space-y-6">
          {features.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-dim">
                <Icon className="h-4 w-4 text-brand" strokeWidth={2} />
              </div>
              <div>
                <div className="text-sm font-semibold text-copy-primary mb-1">
                  {title}
                </div>
                <div className="text-xs text-copy-muted leading-relaxed">
                  {description}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-xs text-copy-faint">
        © 2026 Ghost AI. All rights reserved.
      </div>
    </aside>
  );
}
