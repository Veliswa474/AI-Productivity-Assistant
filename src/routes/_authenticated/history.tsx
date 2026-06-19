import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listHistory, deleteGeneration } from "@/lib/data.functions";
import { PageHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { History as HistoryIcon, Mail, FileText, ListTodo, Search, Trash2, Copy, Download } from "lucide-react";
import { copyToClipboard, downloadPDF } from "@/lib/download";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — ProductivityAI" }] }),
  component: HistoryPage,
});

const types = [
  { v: "all", label: "All", icon: HistoryIcon },
  { v: "email", label: "Emails", icon: Mail },
  { v: "notes", label: "Notes", icon: FileText },
  { v: "research", label: "Research", icon: Search },
  { v: "planner", label: "Plans", icon: ListTodo },
] as const;

function HistoryPage() {
  const listFn = useServerFn(listHistory);
  const delFn = useServerFn(deleteGeneration);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof types)[number]["v"]>("all");
  const [open, setOpen] = useState<string | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["history", q, type],
    queryFn: () => listFn({ data: { q, type } }),
  });

  async function remove(id: string) {
    if (!confirm("Delete this entry?")) return;
    try {
      await delFn({ data: { id } });
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (open === id) setOpen(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  return (
    <div>
      <PageHeader
        title="History"
        description="Everything you've generated, automatically saved."
        icon={<HistoryIcon className="h-5 w-5" />}
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title…"
            className="max-w-xs"
          />
          <div className="flex flex-wrap gap-1.5">
            {types.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.v}
                  onClick={() => setType(t.v)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                    type === t.v
                      ? "border-primary bg-gradient-brand-soft text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-soft">
          {rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No saved items yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const isOpen = open === r.id;
                const t = types.find((x) => x.v === r.type) ?? types[0];
                const Icon = t.icon;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setOpen(isOpen ? null : r.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent/40"
                    >
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-brand-soft text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{r.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.label} • {new Date(r.created_at).toLocaleString()}
                        </div>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-border bg-background/40 p-5">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={async () => { if (await copyToClipboard(r.output)) toast.success("Copied"); }}>
                            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => downloadPDF(`${r.title}.pdf`, r.title, r.output)}>
                            <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border bg-card p-4 scrollbar-thin">
                          {r.type === "email" ? (
                            <pre className="whitespace-pre-wrap font-sans text-sm">{r.output}</pre>
                          ) : (
                            <Markdown content={r.output} />
                          )}
                        </div>
                      </div>
                    )}
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
