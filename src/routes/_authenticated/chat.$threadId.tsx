import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { getThreadMessages, clearThread } from "@/lib/chat.functions";
import { sendChatMessage } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, User, Trash2, Copy, Loader2 } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { copyToClipboard } from "@/lib/download";
import { toast } from "sonner";
import { AI_DISCLAIMER } from "@/lib/prompts";

const searchSchema = z.object({ prompt: z.string().optional() });

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  validateSearch: searchSchema,
  component: ChatThread,
});

function ChatThread() {
  const { threadId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const loadFn = useServerFn(getThreadMessages);
  const sendFn = useServerFn(sendChatMessage);
  const clearFn = useServerFn(clearThread);

  const { data, isLoading } = useQuery({
    queryKey: ["chat-thread", threadId],
    queryFn: () => loadFn({ data: { threadId } }),
  });

  const [input, setInput] = useState(search.prompt ?? "");
  const [sending, setSending] = useState(false);
  const [optimistic, setOptimistic] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Clear ?prompt= from URL after using it
  useEffect(() => {
    if (search.prompt) {
      navigate({ to: "/chat/$threadId", params: { threadId }, search: {}, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    taRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [data?.messages, optimistic, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setOptimistic((arr) => [...arr, { role: "user", content: text }]);
    setSending(true);
    try {
      await sendFn({ data: { threadId, message: text } });
      setOptimistic([]);
      await qc.invalidateQueries({ queryKey: ["chat-thread", threadId] });
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
      setOptimistic((arr) => arr.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
      taRef.current?.focus();
    }
  }

  async function handleClear() {
    if (!confirm("Clear this conversation? Messages cannot be recovered.")) return;
    try {
      await clearFn({ data: { threadId } });
      qc.invalidateQueries({ queryKey: ["chat-thread", threadId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to clear");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const messages = [
    ...(data?.messages ?? []),
    ...optimistic.map((m, i) => ({ id: `opt-${i}`, role: m.role, content: m.content, created_at: "" })),
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-card/30 px-5 py-3">
        <div className="truncate text-sm font-medium">{data?.thread.title ?? "Chat"}</div>
        <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear chat
        </Button>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
        <div className="mx-auto max-w-3xl space-y-5">
          {isLoading && messages.length === 0 && (
            <div className="flex justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          )}
          {messages.length === 0 && !isLoading && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Start the conversation — ask anything workplace-related.
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role as "user" | "assistant"} content={m.content} />
          ))}
          {sending && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
              </div>
              <span>Thinking…</span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-card/30 p-4">
        <div className="mx-auto max-w-3xl space-y-2">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-soft focus-within:ring-2 focus-within:ring-primary/30">
            <Textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={8000}
              placeholder="Message ProductivityAI…"
              className="min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              size="icon"
              className="h-9 w-9 shrink-0 bg-gradient-brand text-white shadow-glow"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">{AI_DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          isUser ? "bg-muted text-foreground" : "bg-gradient-brand text-white"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div className={`group max-w-[80%] ${isUser ? "items-end" : ""} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-card text-foreground border border-border"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
          ) : (
            <Markdown content={content} />
          )}
        </div>
        {!isUser && (
          <button
            onClick={async () => {
              if (await copyToClipboard(content)) toast.success("Copied");
            }}
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground opacity-0 transition group-hover:opacity-100"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
        )}
      </div>
    </div>
  );
}
