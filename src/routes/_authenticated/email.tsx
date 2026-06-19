import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateEmail } from "@/lib/ai.functions";
import { PageHeader } from "@/components/app-shell";
import { AINotice } from "@/components/ai-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Loader2, Copy, Download, RefreshCw, FileText } from "lucide-react";
import { copyToClipboard, downloadPDF, downloadText } from "@/lib/download";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({ meta: [{ title: "Smart Email Generator — ProductivityAI" }] }),
  component: EmailPage,
});

const tones = ["Formal", "Friendly", "Professional", "Persuasive", "Apologetic"] as const;
const audiences = ["Client", "Manager", "Team", "Customer"] as const;

function EmailPage() {
  const fn = useServerFn(generateEmail);

  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [tone, setTone] = useState<(typeof tones)[number]>("Professional");
  const [audience, setAudience] = useState<(typeof audiences)[number]>("Client");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!recipient || !subject || !purpose || !keyPoints) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fn({
        data: { recipient, subject, purpose, keyPoints, tone, audience },
      });
      setOutput(res.output);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Smart Email Generator"
        description="Draft polished, on-tone emails in seconds."
        icon={<Mail className="h-5 w-5" />}
      />
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-semibold">Email details</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Recipient</Label>
              <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} maxLength={200} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Q3 launch update" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={500} placeholder="Share status and request feedback" />
          </div>

          <div className="space-y-1.5">
            <Label>Key points</Label>
            <Textarea value={keyPoints} onChange={(e) => setKeyPoints(e.target.value)} maxLength={2000} rows={5} placeholder={"• Launch date moved to Oct 15\n• Need design sign-off by Fri\n• Beta cohort: 50 users"} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tones.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {audiences.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full bg-gradient-brand text-white shadow-glow">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Generate email
          </Button>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Output</h2>
            {output && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Regenerate
                </Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  if (await copyToClipboard(output)) toast.success("Copied");
                }}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadText(`${subject || "email"}.txt`, output)}>
                  <FileText className="mr-1.5 h-3.5 w-3.5" /> TXT
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadPDF(`${subject || "email"}.pdf`, subject || "Email", output)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                </Button>
              </div>
            )}
          </div>

          {output ? (
            <>
              <Textarea
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                rows={18}
                className="font-mono text-sm"
              />
              <AINotice />
            </>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              Your generated email will appear here.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
