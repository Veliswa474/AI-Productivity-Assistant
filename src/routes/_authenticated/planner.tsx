import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { planTasks } from "@/lib/ai.functions";
import { PageHeader } from "@/components/app-shell";
import { AINotice } from "@/components/ai-notice";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListTodo, Loader2, Copy, Download } from "lucide-react";
import { copyToClipboard, downloadPDF } from "@/lib/download";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "AI Task Planner — ProductivityAI" }] }),
  component: PlannerPage,
});

function PlannerPage() {
  const fn = useServerFn(planTasks);
  const [tasks, setTasks] = useState("");
  const [workingHours, setWorkingHours] = useState("09:00 - 17:00");
  const [priority, setPriority] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePlan() {
    if (!tasks.trim() || !workingHours.trim()) {
      toast.error("Please fill in tasks and working hours");
      return;
    }
    setLoading(true);
    try {
      const res = await fn({ data: { tasks, workingHours, priority } });
      setOutput(res.output);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Task Planner"
        description="Build a realistic daily schedule, weekly view and priority matrix."
        icon={<ListTodo className="h-5 w-5" />}
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[400px_1fr]">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-semibold">Your tasks</h2>

          <div className="space-y-1.5">
            <Label>Working hours</Label>
            <Input value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} placeholder="09:00 - 17:00" maxLength={200} />
          </div>

          <div className="space-y-1.5">
            <Label>Priority notes (optional)</Label>
            <Input value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="Ship roadmap before Friday" maxLength={500} />
          </div>

          <div className="space-y-1.5">
            <Label>Tasks (one per line)</Label>
            <Textarea
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              rows={12}
              placeholder={"Prep board deck — due Thu, 2h\nReply to customer escalations, urgent, 1h\nReview design mocks, 30m\nWeekly 1:1s"}
              maxLength={8000}
            />
          </div>

          <Button onClick={handlePlan} disabled={loading} className="w-full bg-gradient-brand text-white shadow-glow">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListTodo className="mr-2 h-4 w-4" />}
            Build my plan
          </Button>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your plan</h2>
            {output && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={async () => { if (await copyToClipboard(output)) toast.success("Copied"); }}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadPDF("task-plan.pdf", "Task plan", output)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                </Button>
              </div>
            )}
          </div>
          {output ? (
            <>
              <div className="max-h-[700px] overflow-y-auto rounded-xl border border-border bg-background/50 p-5 scrollbar-thin">
                <Markdown content={output} />
              </div>
              <AINotice />
            </>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              Your schedule will appear here as beautiful timeline cards.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
