import { Liveblocks } from "@liveblocks/node";

const CURSOR_COLOR_PALETTE = [
  "#f97316",
  "#facc15",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#14b8a6",
] as const;

const globalForLiveblocks = globalThis as {
  liveblocks?: Liveblocks;
};

export function getLiveblocksClient(): Liveblocks {
  if (globalForLiveblocks.liveblocks) return globalForLiveblocks.liveblocks;

  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "LIVEBLOCKS_SECRET_KEY is required to initialize the Liveblocks client",
    );
  }

  const client = new Liveblocks({ secret });
  globalForLiveblocks.liveblocks = client;
  return client;
}

export function getCursorColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % CURSOR_COLOR_PALETTE.length;
  return CURSOR_COLOR_PALETTE[index];
}
