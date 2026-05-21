declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {};

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    RoomEvent:
      | { kind: "ai:start"; status: string }
      | { kind: "ai:status"; status: string; message?: string }
      | { kind: "ai:cursor"; cursor: { x: number; y: number } | null }
      | { kind: "ai:thinking"; thinking: boolean }
      | {
          kind: "ai:complete";
          status: string;
          nodesAdded: number;
          edgesAdded: number;
        }
      | { kind: "ai:error"; message: string }
      | {
          kind: "chat:message";
          id: string;
          sender: string;
          role: "user" | "ai";
          content: string;
          timestamp: number;
        };

    ThreadMetadata: {};

    RoomInfo: {};
  }
}

export {};
