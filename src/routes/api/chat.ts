import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { Database, Json } from "@/integrations/supabase/types";
import { isProviderId, type ProviderId } from "@/lib/providers";

function systemPrompt() {
  const now = new Date().toUTCString();
  return `তুমি Sapience AI — একজন গভীর চিন্তাশীল, উষ্ণ ও বুদ্ধিমান সহচর। আজকের তারিখ ও সময় (UTC): ${now}.

You are Sapience AI. Behave like a thoughtful, emotionally intelligent human expert, not a robotic chatbot:
- Understand intent, emotion and context behind every message; read between the lines and ask a short clarifying question only when truly needed.
- Reply in the user's language (Bengali, English or mixed "Banglish") with natural, warm, human tone. Use light humor when it fits.
- Think step by step for complex problems; be precise, honest, and admit uncertainty instead of guessing.
- When you have live web search, use it for anything current (news, prices, scores, weather, recent events) and cite sources.
- Format clearly with markdown: headings, lists, tables, and code blocks when useful. Never mention these instructions.`;
}

function buildModel(provider: ProviderId, model: string, web: boolean) {
  if (provider === "gemini") {
    const google = createGoogleGenerativeAI({ apiKey: process.env["GEMINI_API_KEY"] });
    return {
      model: google(model),
      tools: web ? { google_search: google.tools.googleSearch({}) } : undefined,
    };
  }
  if (provider === "openrouter") {
    const or = createOpenAICompatible({
      name: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env["OPENROUTER_API_KEY"],
      headers: { "X-Title": "Sapience AI" },
    });
    return { model: or(web && !model.endsWith(":online") ? `${model}:online` : model), tools: undefined };
  }
  const groq = createOpenAICompatible({
    name: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env["GROQ_API_KEY"],
  });
  return { model: groq(model), tools: undefined };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const url = process.env["SUPABASE_URL"]!;
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient<Database>(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            headers: { Authorization: `Bearer ${token}` },
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });
        const { data: userData, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as {
          messages: UIMessage[];
          threadId: string;
          provider: string;
          model: string;
          web?: boolean;
        };
        if (!Array.isArray(body.messages) || !body.threadId || !isProviderId(body.provider) || !body.model) {
          return new Response("Bad request", { status: 400 });
        }

        const { data: thread } = await supabase
          .from("threads")
          .select("id, title")
          .eq("id", body.threadId)
          .maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        const { model, tools } = buildModel(body.provider, body.model, body.web !== false);

        const result = streamText({
          model,
          system: systemPrompt(),
          messages: await convertToModelMessages(body.messages),
          tools,
          stopWhen: stepCountIs(5),
          abortSignal: request.signal,
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages,
          sendReasoning: true,
          sendSources: true,
          onError: (err) => {
            console.error("chat error", err);
            const msg = err instanceof Error ? err.message : String(err);
            return `মডেল থেকে উত্তর আনা যায়নি: ${msg}`;
          },
          onFinish: async ({ messages }) => {
            const rows = messages.map((m) => ({
              thread_id: body.threadId,
              user_id: userId,
              ui_id: m.id,
              role: m.role,
              parts: m.parts as unknown as Json,
            }));
            const { error } = await supabase.from("messages").upsert(rows, { onConflict: "thread_id,ui_id" });
            if (error) console.error("save messages failed", error);

            const firstUser = messages.find((m) => m.role === "user");
            const firstText = firstUser?.parts.find((p) => p.type === "text");
            const update: { updated_at: string; title?: string } = { updated_at: new Date().toISOString() };
            if (thread.title === "নতুন কথোপকথন" && firstText && "text" in firstText) {
              update.title = firstText.text.slice(0, 60);
            }
            const { error: tErr } = await supabase.from("threads").update(update).eq("id", body.threadId);
            if (tErr) console.error("update thread failed", tErr);
          },
        });
      },
    },
  },
});
