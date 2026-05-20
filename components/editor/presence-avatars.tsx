"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react/suspense";

import { cn } from "@/lib/utils";

const AVATAR_LIMIT = 5;
const AVATAR_SIZE_CLASS = "h-7 w-7";
const FALLBACK_COLOR = "#808090";

export function PresenceAvatars() {
  const { user } = useUser();
  const others = useOthers();

  const currentUserId = user?.id ?? null;
  const collaborators = others.filter(
    (other) => other.id && other.id !== currentUserId,
  );

  const visible = collaborators.slice(0, AVATAR_LIMIT);
  const overflow = collaborators.length - visible.length;
  const hasCollaborators = visible.length > 0;

  return (
    <div className="flex items-center gap-2">
      {hasCollaborators ? (
        <div className="flex items-center -space-x-2">
          {visible.map((collaborator) => (
            <CollaboratorAvatar
              key={collaborator.connectionId}
              name={collaborator.info?.name ?? "Collaborator"}
              avatar={collaborator.info?.avatar ?? ""}
              color={collaborator.info?.color ?? FALLBACK_COLOR}
            />
          ))}
          {overflow > 0 ? (
            <div
              className={cn(
                AVATAR_SIZE_CLASS,
                "flex items-center justify-center rounded-full bg-bg-subtle text-[10px] font-medium text-copy-secondary ring-2 ring-bg-surface",
              )}
              title={`${overflow} more`}
              aria-label={`${overflow} more collaborator${overflow === 1 ? "" : "s"}`}
            >
              +{overflow}
            </div>
          ) : null}
        </div>
      ) : null}

      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-7 w-7",
            userButtonAvatarBox: "h-7 w-7",
          },
        }}
      />
    </div>
  );
}

interface CollaboratorAvatarProps {
  name: string;
  avatar: string;
  color: string;
}

function CollaboratorAvatar({ name, avatar, color }: CollaboratorAvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt=""
        title={name}
        aria-label={name}
        className={cn(
          AVATAR_SIZE_CLASS,
          "rounded-full object-cover ring-2 ring-bg-surface",
        )}
      />
    );
  }

  return (
    <div
      title={name}
      aria-label={name}
      className={cn(
        AVATAR_SIZE_CLASS,
        "flex items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-bg-surface",
      )}
      style={{ backgroundColor: color }}
    >
      {initials || "?"}
    </div>
  );
}
