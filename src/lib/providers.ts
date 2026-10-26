// Client-safe provider metadata shared by the model picker and the chat server route.
export type ProviderId = "gemini" | "openrouter" | "groq";

export type ModelOption = { id: string; label: string };

export const PROVIDERS: { id: ProviderId; name: string; webSearch: string }[] = [
  { id: "gemini", name: "Google Gemini", webSearch: "Google Search দিয়ে লাইভ ইন্টারনেট" },
  { id: "openrouter", name: "OpenRouter", webSearch: "OpenRouter ওয়েব সার্চ দিয়ে লাইভ ইন্টারনেট" },
  { id: "groq", name: "Groq", webSearch: "অতি-দ্রুত উত্তর (ইন্টারনেট সার্চ নেই)" },
];

// Fallbacks verified against each provider's live model list; the app also loads the live list at runtime.
export const DEFAULT_MODELS: Record<ProviderId, ModelOption[]> = {
  gemini: [
    { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
    { id: "gemini-4-argon", label: "Gemini 4 Argon" },
    { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  ],
  openrouter: [
    { id: "openai/gpt-6.1-sol", label: "OpenAI: GPT-6.1 Sol" },
    { id: "anthropic/claude-sonnet-5.5", label: "Anthropic: Claude Sonnet 5.5" },
    { id: "google/gemini-4-argon", label: "Google: Gemini 4 Argon" },
    { id: "moonshotai/kimi-k3.1-pro", label: "MoonshotAI: Kimi K3.1 Pro" },
  ],
  groq: [
    { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
    { id: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B" },
    { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
  ],
};

export const DEFAULT_SELECTION = { provider: "gemini" as ProviderId, model: "gemini-3.8-flash" };

export function isProviderId(v: unknown): v is ProviderId {
  return v === "gemini" || v === "openrouter" || v === "groq";
}
