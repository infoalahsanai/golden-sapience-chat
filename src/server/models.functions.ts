import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_MODELS, type ModelOption, type ProviderId } from "@/lib/providers";

const GEMINI_SKIP = /(tts|image|banana|lyria|robotics|computer-use|transcribe|omni|embedding|antigravity|deep-research|customtools|aqa)/i;
const GROQ_SKIP = /(whisper|guard|orpheus|safeguard|tts)/i;

async function geminiModels(): Promise<ModelOption[]> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) return [];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(key)}`,
  );
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const json = (await res.json()) as {
    models?: { name: string; displayName?: string; supportedGenerationMethods?: string[] }[];
  };
  return (json.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => ({ id: m.name.replace(/^models\//, ""), label: m.displayName ?? m.name }))
    .filter((m) => !GEMINI_SKIP.test(m.id));
}

async function groqModels(): Promise<ModelOption[]> {
  const key = process.env["GROQ_API_KEY"];
  if (!key) return [];
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const json = (await res.json()) as { data?: { id: string; active?: boolean }[] };
  return (json.data ?? [])
    .filter((m) => m.active !== false && !GROQ_SKIP.test(m.id))
    .map((m) => ({ id: m.id, label: m.id }));
}

async function openrouterModels(): Promise<ModelOption[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models");
  if (!res.ok) throw new Error(`openrouter ${res.status}`);
  const json = (await res.json()) as {
    data?: { id: string; name?: string; architecture?: { output_modalities?: string[] } }[];
  };
  return (json.data ?? [])
    .filter((m) => !m.id.endsWith(":batch"))
    .filter((m) => !m.architecture?.output_modalities || m.architecture.output_modalities.includes("text"))
    .map((m) => ({ id: m.id, label: m.name ?? m.id }));
}

async function safe(p: ProviderId, fn: () => Promise<ModelOption[]>) {
  try {
    const list = await fn();
    return list.length ? list : DEFAULT_MODELS[p];
  } catch (e) {
    console.error("model list failed", p, e);
    return DEFAULT_MODELS[p];
  }
}

export const listModels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const [gemini, openrouter, groq] = await Promise.all([
      safe("gemini", geminiModels),
      safe("openrouter", openrouterModels),
      safe("groq", groqModels),
    ]);
    return { gemini, openrouter, groq } satisfies Record<ProviderId, ModelOption[]>;
  });
