import { currentUser } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

import { getCursorColorForUser, getLiveblocksClient } from "@/lib/liveblocks";
import { getProjectForUser } from "@/lib/project-access";

function readRoomId(body: unknown): string | null {
  if (body && typeof body === "object" && "room" in body) {
    const raw = (body as { room?: unknown }).room;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return null;
}

function buildDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  emailAddresses: { emailAddress: string }[];
}): string {
  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName.length > 0) return fullName;
  if (user.username) return user.username;
  return user.emailAddresses[0]?.emailAddress ?? "Anonymous";
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const roomId = readRoomId(body);
  if (!roomId) {
    return Response.json({ error: "room is required" }, { status: 400 });
  }

  const identity = {
    userId: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? null,
  };

  const project = await getProjectForUser(roomId, identity);
  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const liveblocks = getLiveblocksClient();

  const name = buildDisplayName(user);
  const avatar = user.imageUrl ?? "";
  const color = getCursorColorForUser(user.id);

  const session = liveblocks.prepareSession(user.id, {
    userInfo: { name, avatar, color },
  });
  session.allow(roomId, session.FULL_ACCESS);

  const { status, body: tokenBody } = await session.authorize();
  return new Response(tokenBody, { status });
}
