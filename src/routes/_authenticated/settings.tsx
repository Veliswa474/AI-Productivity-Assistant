import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/lib/data.functions";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Sun, Moon, Shield, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — ProductivityAI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const get = useServerFn(getProfile);
  const upd = useServerFn(updateProfile);
  const qc = useQueryClient();

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => get({}) });

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState("en");
  const [creativity, setCreativity] = useState(0.7);
  const [notifs, setNotifs] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setTheme((profile.theme as "light" | "dark") ?? "light");
    setLanguage(profile.language ?? "en");
    setCreativity(Number(profile.ai_creativity ?? 0.7));
    setNotifs(profile.notifications_enabled ?? true);
  }, [profile]);

  function applyTheme(t: "light" | "dark") {
    setTheme(t);
    if (t === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("pai_theme", t);
  }

  async function save() {
    try {
      await upd({ data: { theme, language, ai_creativity: creativity, notifications_enabled: notifs } });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  return (
    <div>
      <PageHeader title="Settings" description="Customize your AI assistant." icon={<SettingsIcon className="h-5 w-5" />} />
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-semibold">Appearance</h2>
          <div>
            <Label className="mb-2 block">Theme</Label>
            <div className="grid grid-cols-2 gap-2">
              <ThemeOption active={theme === "light"} onClick={() => applyTheme("light")} icon={<Sun className="h-4 w-4" />} label="Light" />
              <ThemeOption active={theme === "dark"} onClick={() => applyTheme("dark")} icon={<Moon className="h-4 w-4" />} label="Dark" />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-semibold">AI behaviour</h2>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label>AI creativity</Label>
              <span className="text-xs text-muted-foreground">{creativity.toFixed(2)}</span>
            </div>
            <Slider min={0} max={1} step={0.05} value={[creativity]} onValueChange={(v) => setCreativity(v[0])} />
            <p className="mt-1 text-xs text-muted-foreground">Lower = focused & deterministic. Higher = more creative.</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Notifications</Label>
              <p className="text-xs text-muted-foreground">In-app activity notifications.</p>
            </div>
            <Switch checked={notifs} onCheckedChange={setNotifs} />
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            <h2 className="font-semibold">Responsible AI</h2>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <ResponsibleItem title="Privacy notice">
              Your inputs are processed by our AI gateway to generate responses and stored only in your private history. We never share data with other users.
            </ResponsibleItem>
            <ResponsibleItem title="Ethical AI">
              ProductivityAI is designed to assist — not replace — your professional judgement. Use it as a starting point, not the final word.
            </ResponsibleItem>
            <ResponsibleItem title="Bias awareness">
              AI models reflect patterns in their training data and can carry biases. Be mindful when generating content about people, groups, or sensitive topics.
            </ResponsibleItem>
            <ResponsibleItem title="Hallucination disclaimer">
              AI can confidently state inaccurate facts. Always verify dates, names, statistics, and quotations before professional use.
            </ResponsibleItem>
          </div>
        </section>

        <div className="lg:col-span-2 flex justify-end">
          <Button onClick={save} className="bg-gradient-brand text-white shadow-glow">Save changes</Button>
        </div>
      </div>
    </div>
  );
}

function ThemeOption({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
        active ? "border-primary bg-gradient-brand-soft text-primary" : "border-border bg-background hover:bg-accent"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function ResponsibleItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
        <ShieldAlert className="h-3.5 w-3.5 text-warning" /> {title}
      </div>
      <p>{children}</p>
    </div>
  );
}
