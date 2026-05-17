import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-base px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-bg-elevated">
          <Lock className="h-8 w-8 text-copy-muted" />
        </div>
        <h1 className="text-xl font-semibold text-copy-primary">
          Access denied
        </h1>
        <p className="max-w-sm text-sm text-copy-muted">
          You don&apos;t have access to this project, or it no longer exists.
        </p>
        <Button asChild>
          <Link href="/editor">Back to projects</Link>
        </Button>
      </div>
    </main>
  );
}
