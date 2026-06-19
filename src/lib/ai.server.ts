// Server-only helper for calling the Lovable AI Gateway (OpenAI-compatible).
// Do NOT import this file from client code or *.functions.ts module scope.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callAI(opts: {
  system?: string;
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
}): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const messages: ChatMessage[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push(...opts.messages);

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
    }),
  });

  if (res.status === 429) throw new Error("AI rate limit exceeded. Please try again in a moment.");
  if (res.status === 402)
    throw new Error("AI credits exhausted. Please add credits in workspace billing.");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response");
  return content.trim();
}
