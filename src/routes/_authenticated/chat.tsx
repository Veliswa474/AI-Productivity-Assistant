import { createFileRoute, Link, Outlet, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listThreads, createThread, deleteThread } from "@/lib/chat.functions";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "AI Chatbot — ProductivityAI" }] }),
  component: ChatLayout,
});

function ChatLayout() {
  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const deleteFn = useServerFn(deleteThread);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Active thread id from URL
  const match = pathname.match(/^\/chat\/([0-9a-f-]{36})/i);
  const activeId = match?.[1] ?? null;

  const { data: threads = [] } = useQuery({
    queryKey: ["chat-threads"],
    queryFn: () => listFn({}),
  });

  async function newThread() {
    try {
      const t = await createFn({});
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create chat");
    }
  }

  async function removeThread(id: string) {
    if (!confirm("Delete this conversation?")) return;
    try {
      await deleteFn({ data: { id } });
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
      if (activeId === id) navigate({ to: "/chat" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col md:h-screen">
      <PageHeader
        title="AI Workplace Chatbot"
        description="Your always-on AI coworker."
        icon={<MessageSquare className="h-5 w-5" />}
        actions={
          <Button onClick={newThread} className="bg-gradient-brand text-white">
            <Plus className="mr-1.5 h-4 w-4" /> New chat
          </Button>
        }
      />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card/30 md:flex md:flex-col">
          <div className="border-b border-border p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {threads.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No chats yet. Start a new one.</p>
            ) : (
              <ul className="space-y-1">
                {threads.map((t) => (
                  <li key={t.id} className="group flex items-stretch">
                    <Link
                      to="/chat/$threadId"
                      params={{ threadId: t.id }}
                      className={cn(
                        "min-w-0 flex-1 truncate rounded-l-md px-3 py-2 text-sm transition-colors",
                        activeId === t.id
                          ? "bg-gradient-brand-soft font-medium text-primary"
                          : "text-foreground/80 hover:bg-accent",
                      )}
                    >
                      {t.title}
                    </Link>
                    <button
                      onClick={() => removeThread(t.id)}
                      className="rounded-r-md px-2 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
