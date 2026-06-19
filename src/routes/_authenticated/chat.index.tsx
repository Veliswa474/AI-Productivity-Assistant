import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { createThread } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, FileText, ListTodo, Search, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

const suggestions = [
  { label: "Write an email", icon: Mail, prompt: "Help me write a professional email to my team about a project delay." },
  { label: "Summarize a meeting", icon: FileText, prompt: "I'll paste my meeting notes — please summarise them with action items." },
  { label: "Plan my day", icon: ListTodo, prompt: "Help me plan my day. I have 5 tasks and 8 working hours." },
  { label: "Explain AI", icon: Sparkles, prompt: "Explain Large Language Models in simple terms for a non-technical executive." },
  { label: "Research a topic", icon: Search, prompt: "Give me a quick briefing on remote work productivity trends in 2025." },
  { label: "Brainstorm ideas", icon: BookOpen, prompt: "Brainstorm 5 creative ideas for our quarterly team retreat." },
];

function ChatIndex() {
  const createFn = useServerFn(createThread);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function startWith(prompt?: string) {
    try {
      const t = await createFn({});
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
      navigate({
        to: "/chat/$threadId",
        params: { threadId: t.id },
        search: prompt ? { prompt } : {},
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start chat");
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
        <Sparkles className="h-7 w-7 text-white" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">How can I help today?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Pick a starter prompt or open a new chat.</p>

      <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => startWith(s.prompt)}
              className="group rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
            >
              <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand-soft text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-sm font-medium">{s.label}</div>
              <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{s.prompt}</div>
            </button>
          );
        })}
      </div>

      <Button onClick={() => startWith()} className="mt-8 bg-gradient-brand text-white shadow-glow">
        Start a blank chat
      </Button>
    </div>
  );
}
