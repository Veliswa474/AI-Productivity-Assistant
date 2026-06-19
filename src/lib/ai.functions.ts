import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

import {
  CHAT_SYSTEM,
  EMAIL_SYSTEM,
  NOTES_SYSTEM,
  PLANNER_SYSTEM,
  RESEARCH_SYSTEM,
} from "./prompts";

const EmailInput = z.object({
  recipient: z.string().min(1).max(200),
  subject: z.string().min(1).max(200),
  purpose: z.string().min(1).max(500),
  keyPoints: z.string().min(1).max(2000),
  tone: z.enum(["Formal", "Friendly", "Professional", "Persuasive", "Apologetic"]),
  audience: z.enum(["Client", "Manager", "Team", "Customer"]),
  temperature: z.number().min(0).max(1).optional(),
});

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data, context }) => {
    const { callAI } = await import("./ai.server");
    const prompt = `Recipient: ${data.recipient}
Subject: ${data.subject}
Purpose: ${data.purpose}
Tone: ${data.tone}
Audience: ${data.audience}
Key points:
${data.keyPoints}`;
    const output = await callAI({
      system: EMAIL_SYSTEM,
      messages: [{ role: "user", content: prompt }],
      temperature: data.temperature ?? 0.7,
    });
    await context.supabase.from("generations").insert({
      user_id: context.userId,
      type: "email",
      title: data.subject || "Email",
      input: data,
      output,
    });
    return { output };
  });

const NotesInput = z.object({
  notes: z.string().min(20).max(40000),
  title: z.string().max(200).optional(),
  temperature: z.number().min(0).max(1).optional(),
});

export const summarizeNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => NotesInput.parse(d))
  .handler(async ({ data, context }) => {
    const { callAI } = await import("./ai.server");
    const output = await callAI({
      system: NOTES_SYSTEM,
      messages: [{ role: "user", content: `Meeting notes:\n\n${data.notes}` }],
      temperature: data.temperature ?? 0.4,
    });
    await context.supabase.from("generations").insert({
      user_id: context.userId,
      type: "notes",
      title: data.title || "Meeting summary",
      input: { notes: data.notes.slice(0, 4000) },
      output,
    });
    return { output };
  });

const PlannerInput = z.object({
  tasks: z.string().min(3).max(8000),
  workingHours: z.string().min(1).max(200),
  priority: z.string().max(500).optional().default(""),
  temperature: z.number().min(0).max(1).optional(),
});

export const planTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlannerInput.parse(d))
  .handler(async ({ data, context }) => {
    const { callAI } = await import("./ai.server");
    const prompt = `Working hours: ${data.workingHours}
Priority guidance: ${data.priority || "(none)"}
Tasks (one per line, may include deadlines/estimates):
${data.tasks}`;
    const output = await callAI({
      system: PLANNER_SYSTEM,
      messages: [{ role: "user", content: prompt }],
      temperature: data.temperature ?? 0.5,
    });
    await context.supabase.from("generations").insert({
      user_id: context.userId,
      type: "planner",
      title: "Task plan",
      input: data,
      output,
    });
    return { output };
  });

const ResearchInput = z.object({
  topic: z.string().min(2).max(300),
  article: z.string().max(40000).optional().default(""),
  temperature: z.number().min(0).max(1).optional(),
});

export const researchTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data, context }) => {
    const { callAI } = await import("./ai.server");
    const prompt = data.article
      ? `Topic: ${data.topic}\n\nSource article / notes:\n${data.article}`
      : `Topic: ${data.topic}`;
    const output = await callAI({
      system: RESEARCH_SYSTEM,
      messages: [{ role: "user", content: prompt }],
      temperature: data.temperature ?? 0.5,
    });
    await context.supabase.from("generations").insert({
      user_id: context.userId,
      type: "research",
      title: data.topic,
      input: { topic: data.topic, hasArticle: !!data.article },
      output,
    });
    return { output };
  });

const ChatInput = z.object({
  threadId: z.string().uuid(),
  message: z.string().min(1).max(8000),
  temperature: z.number().min(0).max(1).optional(),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ChatInput.parse(d))
  .handler(async ({ data, context }) => {
    const { callAI } = await import("./ai.server");
    const { supabase, userId } = context;

    // Verify thread ownership
    const { data: thread } = await supabase
      .from("chat_threads")
      .select("id,title")
      .eq("id", data.threadId)
      .single();
    if (!thread) throw new Error("Thread not found");

    // Save user message
    await supabase.from("chat_messages").insert({
      thread_id: data.threadId,
      user_id: userId,
      role: "user",
      content: data.message,
    });

    // Load history
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role,content")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true })
      .limit(40);

    const messages = (history ?? []).map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    const reply = await callAI({
      system: CHAT_SYSTEM,
      messages,
      temperature: data.temperature ?? 0.7,
    });

    await supabase.from("chat_messages").insert({
      thread_id: data.threadId,
      user_id: userId,
      role: "assistant",
      content: reply,
    });

    // Update thread title from first user message if still default
    if (thread.title === "New chat") {
      const newTitle = data.message.slice(0, 60);
      await supabase
        .from("chat_threads")
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq("id", data.threadId);
    } else {
      await supabase
        .from("chat_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", data.threadId);
    }

    return { reply };
  });
