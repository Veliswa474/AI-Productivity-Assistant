import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Mail, FileText, ListTodo, Search, MessageSquare, Shield, Zap, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProductivityAI — Automate Your Workday with AI" },
      {
        name: "description",
        content:
          "Draft emails, summarise meetings, plan your day, research topics and chat with an AI coworker — all in one premium workplace assistant.",
      },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

const features = [
  { icon: Mail, title: "Smart Email Generator", desc: "Compose ready-to-send emails in any tone, for any audience." },
  { icon: FileText, title: "Meeting Notes Summarizer", desc: "Turn raw notes into executive summaries with action items." },
  { icon: ListTodo, title: "AI Task Planner", desc: "Build a realistic daily schedule and priority matrix." },
  { icon: Search, title: "AI Research Assistant", desc: "Get briefings with key insights, facts and recommendations." },
  { icon: MessageSquare, title: "AI Workplace Chatbot", desc: "Your always-on coworker with full chat history." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight">ProductivityAI</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            to="/auth"
            search={{ mode: "login" }}
            className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "register" }}
            className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
        <div className="absolute inset-x-0 -top-10 -z-10 mx-auto h-72 max-w-3xl rounded-full bg-gradient-brand opacity-20 blur-3xl" />
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            Powered by responsible AI
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Automate your workday with{" "}
            <span className="text-gradient-brand">an AI coworker</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Draft emails, summarise meetings, plan your day, research any topic and chat — all from one beautifully simple workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "register" }}
              className="rounded-lg bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
            >
              Start free
            </Link>
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 grid gap-4 rounded-3xl border border-border bg-card p-6 md:grid-cols-3 md:p-8">
          {[
            { icon: Shield, title: "Responsible AI", desc: "Every response is flagged for review with privacy and bias notices." },
            { icon: Zap, title: "Built for speed", desc: "Premium prompts engineered for accurate, workplace-ready output." },
            { icon: BarChart3, title: "Track your impact", desc: "History and analytics show how much time AI saves you." },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-brand-soft text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold">{f.title}</div>
                  <div className="text-sm text-muted-foreground">{f.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ProductivityAI · Built with responsible AI practices
      </footer>
    </div>
  );
}
