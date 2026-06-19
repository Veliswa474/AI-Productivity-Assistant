import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/lib/data.functions";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — ProductivityAI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const get = useServerFn(getProfile);
  const upd = useServerFn(updateProfile);
  const qc = useQueryClient();

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => get({}) });
  const [fullName, setFullName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setOccupation(profile.occupation ?? "");
    setAvatar(profile.avatar_url ?? "");
  }, [profile]);

  async function save() {
    try {
      await upd({
        data: { full_name: fullName, occupation, avatar_url: avatar || "" },
      });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  const initials = (fullName || profile?.email || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      <PageHeader title="Profile" description="Your account details." icon={<User className="h-5 w-5" />} />
      <div className="max-w-2xl space-y-6 p-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-4">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="h-16 w-16 rounded-full border border-border object-cover" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-brand text-xl font-semibold text-white shadow-glow">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold">{fullName || "Unnamed"}</div>
              <div className="truncate text-sm text-muted-foreground">{profile?.email}</div>
              {occupation && <div className="text-xs text-muted-foreground">{occupation}</div>}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-semibold">Edit profile</h2>

          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label>Occupation</Label>
            <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} maxLength={120} placeholder="Product Manager" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={profile?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Avatar URL</Label>
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} maxLength={500} placeholder="https://…" />
          </div>

          <div className="flex justify-end">
            <Button onClick={save} className="bg-gradient-brand text-white shadow-glow">Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
