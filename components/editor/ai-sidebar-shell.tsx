"use client";

import { useUser } from "@clerk/nextjs";
import {
  useBroadcastEvent,
  useEventListener,
} from "@liveblocks/react/suspense";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import {
  Bot,
  Download,
  FileText,
  Loader2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { designAgentTask } from "@/trigger/design-agent";
import { chatMessageSchema, type ChatMessage } from "@/types/tasks";

interface AiSidebarShellProps {
  isOpen: boolean;
  onClose?: () => void;
  projectId?: string;
}

interface ActiveRun {
  runId: string;
  publicToken: string;
}

const TEXTAREA_MIN_HEIGHT = 72;
const TEXTAREA_MAX_HEIGHT = 160;
const AI_SENDER_NAME = "Ghost AI";

const ACTIVE_RUN_STATUSES = new Set([
  "WAITING_FOR_DEPLOY",
  "DELAYED",
  "QUEUED",
  "EXECUTING",
  "REATTEMPTING",
  "FROZEN",
  "PAUSED",
]);

const FINAL_RUN_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "CRASHED",
  "INTERRUPTED",
  "SYSTEM_FAILURE",
  "EXPIRED",
  "TIMED_OUT",
]);

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSenderName(
  user: ReturnType<typeof useUser>["user"],
): string | null {
  if (!user) return null;
  const full = user.fullName?.trim();
  if (full) return full;
  const username = user.username?.trim();
  if (username) return username;
  const email = user.primaryEmailAddress?.emailAddress?.trim();
  if (email) return email;
  return null;
}

function createMessageId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AiSidebarShell({
  isOpen,
  onClose,
  projectId,
}: AiSidebarShellProps) {
  const { user } = useUser();
  const broadcast = useBroadcastEvent();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastRealtimeErrorMessageRef = useRef<string | null>(null);

  const { run, error: realtimeError } = useRealtimeRun<typeof designAgentTask>(
    activeRun?.runId,
    {
      accessToken: activeRun?.publicToken,
      enabled: Boolean(activeRun?.runId && activeRun.publicToken),
    },
  );

  const isRunActive =
    Boolean(activeRun) && (!run || ACTIVE_RUN_STATUSES.has(run.status));

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(
      Math.max(el.scrollHeight, TEXTAREA_MIN_HEIGHT),
      TEXTAREA_MAX_HEIGHT,
    );
    el.style.height = `${next}px`;
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const pushAiMessage = useCallback(
    (content: string) => {
      const candidate: unknown = {
        id: createMessageId(),
        sender: AI_SENDER_NAME,
        role: "ai",
        content,
        timestamp: Date.now(),
      };
      const parsed = chatMessageSchema.safeParse(candidate);
      if (!parsed.success) return;
      try {
        broadcast({ kind: "chat:message", ...parsed.data });
      } catch {
        // best-effort broadcast
      }
      appendMessage(parsed.data);
    },
    [appendMessage, broadcast],
  );

  useEventListener(({ event }) => {
    if (event.kind === "chat:message") {
      const parsed = chatMessageSchema.safeParse(event);
      if (!parsed.success) return;
      appendMessage(parsed.data);
      return;
    }
    if (event.kind === "ai:status") {
      const next = event.message ?? event.status;
      if (typeof next === "string" && next.trim().length > 0) {
        setStatusMessage(next);
      }
      return;
    }
    if (event.kind === "ai:start") {
      setStatusMessage(event.status ?? "Starting");
      return;
    }
  });

  useEffect(() => {
    if (!run) return;
    if (!FINAL_RUN_STATUSES.has(run.status)) return;

    if (run.status === "COMPLETED") {
      const summary =
        run.output &&
        typeof run.output.summary === "string" &&
        run.output.summary.trim().length > 0
          ? run.output.summary
          : "Done.";
      pushAiMessage(summary);
    } else {
      pushAiMessage(`AI run ${run.status.toLowerCase().replace(/_/g, " ")}.`);
    }

    setActiveRun(null);
    setStatusMessage(null);
  }, [run, pushAiMessage]);

  useEffect(() => {
    if (!realtimeError) return;
    if (lastRealtimeErrorMessageRef.current === realtimeError.message) {
      return;
    }

    pushAiMessage(`Realtime connection error: ${realtimeError.message}`);
    setActiveRun(null);
    setStatusMessage(null);
    lastRealtimeErrorMessageRef.current = realtimeError.message;
  }, [realtimeError, pushAiMessage]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (!projectId) {
        setSendError("Open a project before sending messages.");
        return;
      }

      const sender = getSenderName(user);
      if (!sender) {
        setSendError("Sign in to send chat messages.");
        return;
      }

      const candidate: unknown = {
        id: createMessageId(),
        sender,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const parsed = chatMessageSchema.safeParse(candidate);
      if (!parsed.success) {
        setSendError("Could not send: message failed validation.");
        return;
      }

      try {
        broadcast({ kind: "chat:message", ...parsed.data });
      } catch {
        setSendError("Could not send: connection issue. Try again.");
        return;
      }

      appendMessage(parsed.data);
      setInput("");
      setSendError(null);

      try {
        const response = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            roomId: projectId,
            projectId,
          }),
        });

        if (!response.ok) {
          const detail = await response
            .json()
            .then((b) => (b && typeof b.error === "string" ? b.error : null))
            .catch(() => null);
          pushAiMessage(
            `Could not start the AI run${detail ? `: ${detail}` : "."}`,
          );
          return;
        }

        const body = (await response.json()) as {
          runId?: unknown;
          publicToken?: unknown;
        };
        const runId = typeof body.runId === "string" ? body.runId : null;
        const publicToken =
          typeof body.publicToken === "string" ? body.publicToken : null;

        if (!runId || !publicToken) {
          pushAiMessage("Could not start the AI run: invalid server response.");
          return;
        }

        setStatusMessage("Starting…");
        setActiveRun({ runId, publicToken });
      } catch (error) {
        pushAiMessage(
          `Could not start the AI run: ${error instanceof Error ? error.message : "unknown error"}.`,
        );
      }
    },
    [appendMessage, broadcast, projectId, pushAiMessage, user],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (isRunActive) return;
      void sendMessage(input);
    }
  };

  const ownSenderName = getSenderName(user);
  const disableInput = !projectId || !ownSenderName || isRunActive;
  const disableSend =
    input.trim().length === 0 || !projectId || !ownSenderName || isRunActive;

  return (
    <aside
      className={cn(
        "shrink-0 overflow-hidden border-l border-surface-border bg-bg-surface transition-[width] duration-300 ease-out",
        isOpen ? "w-80" : "w-0",
      )}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full w-80 flex-col p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-ai/20 text-accent-ai-text">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-copy-muted">
              AI Workspace
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close AI sidebar"
            className="h-7 w-7 text-copy-secondary hover:bg-bg-subtle hover:text-copy-primary"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Tabs defaultValue="architect" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid h-9 w-full shrink-0 grid-cols-2 bg-bg-subtle text-xs text-copy-muted">
            <TabsTrigger
              value="architect"
              className="text-xs data-[state=active]:bg-accent-ai data-[state=active]:text-accent-ai-text"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="text-xs data-[state=active]:bg-accent-ai data-[state=active]:text-accent-ai-text"
            >
              Specs
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="architect"
            className="mt-4 flex min-h-0 flex-1 flex-col gap-3 data-[state=inactive]:hidden"
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-2 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-ai/15 text-accent-ai-text">
                    <Bot className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-copy-muted">
                    No messages yet. Describe what you want to design.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2 pr-1">
                  {messages.map((message) => {
                    const isOwn =
                      message.role === "user" &&
                      message.sender === ownSenderName;
                    const isAi = message.role === "ai";
                    return (
                      <li
                        key={message.id}
                        className={cn(
                          "flex flex-col gap-1",
                          isOwn ? "items-end" : "items-start",
                        )}
                      >
                        <div className="flex items-center gap-2 px-1 text-[10px] text-copy-faint">
                          <span className="truncate font-medium text-copy-muted">
                            {message.sender}
                          </span>
                          <span aria-hidden>·</span>
                          <time
                            dateTime={new Date(message.timestamp).toISOString()}
                          >
                            {formatTimestamp(message.timestamp)}
                          </time>
                        </div>
                        <div
                          className={cn(
                            "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                            isOwn
                              ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
                              : isAi
                                ? "border border-surface-border bg-bg-elevated text-accent-ai-text"
                                : "border border-surface-border bg-bg-elevated text-copy-primary",
                          )}
                        >
                          {message.content}
                        </div>
                      </li>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-1">
              {isRunActive ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-xl border border-accent-ai/40 bg-accent-ai/15 px-3 py-1.5 text-[11px] text-accent-ai-text"
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                  </span>
                  <span className="truncate">
                    {statusMessage ?? "Working…"}
                  </span>
                </div>
              ) : null}

              <div className="flex items-end gap-2 rounded-xl border border-surface-border bg-bg-subtle/60 p-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                    if (sendError) setSendError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    projectId
                      ? isRunActive
                        ? "Ghost AI is working…"
                        : "Describe what you want to design…"
                      : "Open a project to chat"
                  }
                  rows={1}
                  disabled={disableInput}
                  className="min-h-[72px] max-h-[160px] flex-1 resize-none bg-transparent px-1 py-1 text-sm text-copy-primary placeholder:text-copy-muted focus:outline-none disabled:opacity-60"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => void sendMessage(input)}
                  aria-label="Send message"
                  disabled={disableSend}
                  className="bg-brand text-bg-base hover:bg-brand/90 disabled:opacity-60"
                >
                  {isRunActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {sendError ? (
                <p role="alert" className="px-1 text-[11px] text-red-400">
                  {sendError}
                </p>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent
            value="specs"
            className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto data-[state=inactive]:hidden"
          >
            <Button
              type="button"
              className="bg-accent-ai text-white hover:bg-accent-ai/90"
            >
              <Sparkles className="h-4 w-4" />
              Generate Spec
            </Button>

            <article className="rounded-xl border border-surface-border bg-bg-elevated p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-ai/15 text-accent-ai-text">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h3 className="text-sm font-medium text-copy-primary">
                    Microservices architecture spec
                  </h3>
                  <p className="line-clamp-2 text-xs text-copy-muted">
                    Auth, billing, and notifications split into independent
                    services behind a shared API gateway.
                  </p>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled
                      className="h-7 px-2 text-xs text-copy-muted"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}
