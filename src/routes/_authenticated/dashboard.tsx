import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardData } from "@/lib/data.functions";
import { PageHeader } from "@/components/app-shell";
import {
  LayoutDashboard,
  Mail,
  FileText,
  ListTodo,
  Search,
  MessageSquare,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ProductivityAI" }] }),
  component: Dashboard,
});

const typeMeta = {
  email: { label: "Email", icon: Mail, color: "text-primary" },
  notes: { label: "Notes", icon: FileText, color: "text-success" },
  research: { label: "Research", icon: Search, color: "text-warning" },
  planner: { label: "Plan", icon: ListTodo, color: "text-primary" },
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  gradient = "bg-gradient-brand-soft",
}: {
  label: string;
  value: number | string;
  icon: typeof Mail;
  gradient?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${gradient} text-primary`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

const quickActions = [
  { to: "/email", label: "Draft an email", icon: Mail, desc: "Smart, on-tone copy" },
  { to: "/notes", label: "Summarize notes", icon: FileText, desc: "Get the gist + actions" },
  { to: "/planner", label: "Plan my day", icon: ListTodo, desc: "A realistic schedule" },
  { to: "/research", label: "Research a topic", icon: Search, desc: "Briefings in seconds" },
  { to: "/chat", label: "Open chatbot", icon: MessageSquare, desc: "Always-on coworker" },
];

const tips = [
  "Batch similar tasks together — your AI planner can group them automatically.",
  "Paste meeting transcripts directly — the summarizer extracts owners and deadlines.",
  "Tone matters: choose Persuasive for sales, Apologetic for service recovery.",
  "Always verify AI output before sending. Treat it as a strong first draft.",
];

function Dashboard() {
  const fn = useServerFn(getDashboardData);
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fn({}),
  });

  const profile = data?.profile;
  const recent = data?.recent ?? [];
  const stats = data?.stats ?? { email: 0, notes: 0, research: 0, planner: 0, chats: 0 };
  const greetingName = profile?.full_name?.split(" ")[0] ?? "there";
  const tip = tips[new Date().getDate() % tips.length];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${greetingName}`}
        description="Here's what your AI assistant has been up to."
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Emails Generated" value={stats.email} icon={Mail} />
          <StatCard label="Notes Summarized" value={stats.notes} icon={FileText} />
          <StatCard label="Research Sessions" value={stats.research} icon={Search} />
          <StatCard label="Tasks Planned" value={stats.planner} icon={ListTodo} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick actions */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Quick actions</h2>
              <span className="text-xs text-muted-foreground">Jump straight in</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((q) => {
                const Icon = q.icon;
                return (
                  <Link
                    key={q.to}
                    to={q.to}
                    className="group flex items-start gap-3 rounded-xl border border-border bg-background/50 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand-soft text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium">{q.label}</div>
                      <div className="text-xs text-muted-foreground">{q.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Tip + chats */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-gradient-brand p-5 text-white shadow-glow">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                Productivity tip
              </div>
              <p className="text-sm leading-relaxed">{tip}</p>
            </div>
            <StatCard
              label="Chat Messages Sent"
              value={stats.chats}
              icon={TrendingUp}
              gradient="bg-success/10"
            />
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link to="/history" className="text-xs font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity yet. Try a quick action above to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((r) => {
                const meta = typeMeta[r.type as keyof typeof typeMeta] ?? typeMeta.email;
                const Icon = meta.icon;
                return (
                  <li key={r.id} className="flex items-center gap-3 py-3">
                    <div className={`grid h-9 w-9 place-items-center rounded-lg bg-muted ${meta.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{meta.label}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
