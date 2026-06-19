import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { summarizeNotes } from "@/lib/ai.functions";
import { PageHeader } from "@/components/app-shell";
import { AINotice } from "@/components/ai-notice";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Copy, Download, Upload } from "lucide-react";
import { copyToClipboard, downloadPDF } from "@/lib/download";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({ meta: [{ title: "Meeting Notes Summarizer — ProductivityAI" }] }),
  component: NotesPage,
});

function NotesPage() {
  const fn = useServerFn(summarizeNotes);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      toast.error("File too large (max 1 MB)");
      return;
    }
    file.text().then((t) => {
      setNotes(t);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
      toast.success("Notes loaded");
    });
  }

  async function handleSummarize() {
    if (notes.trim().length < 20) {
      toast.error("Please paste at least 20 characters of notes");
      return;
    }
    setLoading(true);
    try {
      const res = await fn({ data: { notes, title } });
      setOutput(res.output);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to summarize");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Meeting Notes Summarizer"
        description="Turn raw notes into executive summaries with action items."
        icon={<FileText className="h-5 w-5" />}
      />
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-semibold">Input</h2>

          <div className="space-y-1.5">
            <Label>Meeting title (optional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Q3 Planning Sync" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Notes</Label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent">
                <Upload className="h-3.5 w-3.5" /> Upload .txt
                <input type="file" accept=".txt,text/plain" className="hidden" onChange={handleUpload} />
              </label>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={18}
              placeholder="Paste meeting notes or transcript here…"
              maxLength={40000}
            />
            <div className="text-right text-xs text-muted-foreground">{notes.length.toLocaleString()} / 40,000</div>
          </div>

          <Button onClick={handleSummarize} disabled={loading} className="w-full bg-gradient-brand text-white shadow-glow">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Summarize
          </Button>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Summary</h2>
            {output && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={async () => { if (await copyToClipboard(output)) toast.success("Copied"); }}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadPDF(`${title || "summary"}.pdf`, title || "Meeting summary", output)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                </Button>
              </div>
            )}
          </div>
          {output ? (
            <>
              <div className="max-h-[600px] overflow-y-auto rounded-xl border border-border bg-background/50 p-4 scrollbar-thin">
                <Markdown content={output} />
              </div>
              <AINotice />
            </>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              Your summary will appear here.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
