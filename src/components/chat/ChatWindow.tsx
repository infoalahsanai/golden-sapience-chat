import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { Message } from "ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Globe, Send, Square } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listModels } from "@/server/models.functions";
import { DEFAULT_SELECTION, PROVIDERS, type ProviderId } from "@/lib/providers";
import { ModelPicker } from "./ModelPicker";
import { cn } from "@/lib/utils";
import mark from "@/assets/sapience-mark.png";

const STORE_KEY = "sapience:model";

const SUGGESTIONS = [
  "আজকের বাংলাদেশের প্রধান খবরগুলো কী?",
  "আমার মন খারাপ, একটু কথা বলবে?",
  "একটা ব্যবসার আইডিয়া বিশ্লেষণ করে দাও",
  "Explain quantum computing like I'm 12",
];

export function ChatWindow({ threadId, initialMessages }: { threadId: string; initialMessages: Message[] }) {
  const qc = useQueryClient();
  const fetchModels = useServerFn(listModels);
  const modelsQ = useQuery({ queryKey: ["models"], queryFn: () => fetchModels(), staleTime: 1000 * 60 * 30 });
  const models = modelsQ.data ?? [];

  const [sel, setSel] = useState<{ provider: ProviderId; model: string }>(DEFAULT_SELECTION);
  const [web, setWeb] = useState(true);
  const selRef = useRef({ ...sel, web });
  selRef.current = { ...sel, web };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.provider && parsed?.model) {
          setSel({ provider: parsed.provider, model: parsed.model });
          if (typeof parsed.web === "boolean") setWeb(parsed.web);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...sel, web }));
  }, [sel, web]);

  const { messages, append, status, stop } = useChat({
    id: threadId,
    api: "/api/chat",
    initialMessages,
    headers: async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
    body: { threadId, ...selRef.current },
    onError: (err) => toast.error(err.message || "উত্তর আনা যায়নি"),
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  const webSupported = sel.provider !== "groq";

  function send(text: string) {
    if (!text.trim() || busy) return;
    append({ role: "user", content: text });
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-14 pb-6 md:pt-8">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <img src={mark} alt="" width={96} height={96} className="size-24 drop-shadow-[0_0_30px_var(--primary)]" />
              <h2 className="mt-4 font-display text-3xl font-semibold">Sapience AI</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                মানুষের মতো চিন্তাশীল, সহমর্মী ও প্রখর বুদ্ধিমত্তাসম্পন্ন কৃত্রিম মেধা।
              </p>
              <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border bg-card/50 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col rounded-2xl p-4 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto max-w-[85%] bg-primary text-primary-foreground"
                    : "mr-auto max-w-[90%] border bg-card/80 text-card-foreground shadow-sm"
                )}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))
          )}

          {busy && (
            <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
              <img src={mark} alt="" width={24} height={24} className="size-6 animate-pulse" />
              <span>ভাবছি…</span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <div className="rounded-2xl border bg-card/80 p-3 shadow-gold backdrop-blur">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Sapience-কে যেকোনো কিছু জিজ্ঞেস করুন…"
            rows={2}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <div className="flex items-center gap-2">
              <ModelPicker
                provider={sel.provider}
                model={sel.model}
                models={models}
                loading={modelsQ.isLoading}
                onChange={(provider, model) => setSel({ provider, model })}
              />
              <button
                type="button"
                onClick={() => setWeb((w) => !w)}
                disabled={!webSupported}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  web && webSupported ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="size-3.5" />
                <span className="hidden sm:inline">{web && webSupported ? "ইন্টারনেট চালু" : "ইন্টারনেট বন্ধ"}</span>
              </button>
            </div>

            {busy ? (
              <button
                type="button"
                onClick={stop}
                className="flex size-8 items-center justify-center rounded-lg bg-destructive text-destructive-foreground"
              >
                <Square className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => send(input)}
                disabled={!input.trim()}
                className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Sapience AI ভুল করতে পারে — গুরুত্বপূর্ণ তথ্য যাচাই করে নিন।
        </p>
      </div>
    </div>
  );
}
