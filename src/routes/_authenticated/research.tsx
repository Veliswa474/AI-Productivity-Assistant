import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { researchTopic } from "@/lib/ai.functions";
import { PageHeader } from "@/components/app-shell";
import { AINotice } from "@/components/ai-notice";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2, Copy, Download } from "lucide-react";
import { copyToClipboard, downloadPDF } from "@/lib/download";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({ meta: [{ title: "AI Research Assistant — ProductivityAI" }] }),
  component: ResearchPage,
});

function ResearchPage() {
  const fn = useServerFn(researchTopic);
  const [topic, setTopic] = useState("");
  const [article, setArticle] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!topic.trim()) { toast.error("Please enter a research topic"); return; }
    setLoading(true);
    try {
      const res = await fn({ data: { topic, article } });
      setOutput(res.output);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to research");
    } finally { setLoading(false); }
  }

  return (
    <div>
      <PageHeader
        title="AI Research Assistant"
        description="Get a balanced executive briefing on any topic."
        icon={<Search className="h-5 w-5" />}
      />
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-semibold">Research request</h2>

          <div className="space-y-1.5">
            <Label>Topic</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={300} placeholder="Generative AI adoption in enterprise" />
          </div>

          <div className="space-y-1.5">
            <Label>Optional source article / notes</Label>
            <Textarea value={article} onChange={(e) => setArticle(e.target.value)} rows={14} maxLength={40000} placeholder="Paste an article to ground the analysis…" />
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full bg-gradient-brand text-white shadow-glow">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Generate briefing
          </Button>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Briefing</h2>
            {output && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={async () => { if (await copyToClipboard(output)) toast.success("Copied"); }}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadPDF(`${topic || "briefing"}.pdf`, topic || "Briefing", output)}>
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
              Your briefing will appear here.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
