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
    { id: "meta-llama/llama-3.3-70b-instruct", label: "Meta: Llama 3.3 70B" },
    { id: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B" },
    { id: "deepseek/deepseek-v4.1-flash", label: "DeepSeek V4.1 Flash" },
    { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
  ],
  groq: [
    { id: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B" },
    { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
    { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
  ],
};

// Groq qwen verified live (200 OK); Gemini key currently times out/blocks old models.
export const DEFAULT_SELECTION = { provider: "groq" as ProviderId, model: "qwen/qwen3.8-27b" };

export function isProviderId(v: unknown): v is ProviderId {
  return v === "gemini" || v === "openrouter" || v === "groq";
}
