import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: gens }, { count: msgCount }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("generations")
        .select("id,type,title,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("role", "user"),
    ]);

    const counts = { email: 0, notes: 0, research: 0, planner: 0 };
    const { data: all } = await supabase
      .from("generations")
      .select("type")
      .eq("user_id", userId);
    for (const g of all ?? []) {
      const t = g.type as keyof typeof counts;
      if (t in counts) counts[t]++;
    }

    return {
      profile,
      recent: gens ?? [],
      stats: { ...counts, chats: msgCount ?? 0 },
    };
  });

export const listHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        q: z.string().max(200).optional().default(""),
        type: z.enum(["all", "email", "notes", "research", "planner"]).optional().default("all"),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("generations")
      .select("id,type,title,output,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.type !== "all") q = q.eq("type", data.type);
    if (data.q.trim()) q = q.ilike("title", `%${data.q.trim()}%`);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const deleteGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("generations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

const ProfileUpdate = z.object({
  full_name: z.string().max(120).optional(),
  occupation: z.string().max(120).optional(),
  avatar_url: z.string().url().max(500).optional().or(z.literal("")),
  language: z.string().max(20).optional(),
  theme: z.enum(["light", "dark"]).optional(),
  ai_creativity: z.number().min(0).max(1).optional(),
  notifications_enabled: z.boolean().optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileUpdate.parse(d))
  .handler(async ({ data, context }) => {
    const patch = { ...data, updated_at: new Date().toISOString() };
    const { data: row, error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });
