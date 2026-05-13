import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface AiSidebarShellProps {
  isOpen: boolean;
}

export function AiSidebarShell({ isOpen }: AiSidebarShellProps) {
  return (
    <aside
      className={cn(
        "pointer-events-none fixed bottom-0 right-0 top-14 z-30 w-96 p-4 transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
      aria-hidden={!isOpen}
    >
      <div className="pointer-events-auto flex h-full flex-col rounded-2xl border border-surface-border bg-bg-elevated/95 p-4 backdrop-blur">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold text-copy-primary">AI Assistant</h2>
        </div>

        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-surface-border bg-bg-subtle/40">
          <p className="text-sm text-copy-muted">AI panel shell</p>
        </div>
      </div>
    </aside>
  );
}