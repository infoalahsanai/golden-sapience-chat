import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listModels } from "@/server/models.functions";
import { DEFAULT_MODELS, DEFAULT_SELECTION, PROVIDERS, isProviderId, type ProviderId } from "@/lib/providers";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  PromptInputButton,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
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

export function ChatWindow({ threadId, initialMessages }: { threadId: string; initialMessages: UIMessage[] }) {
  const qc = useQueryClient();
  const fetchModels = useServerFn(listModels);
  const modelsQ = useQuery({ queryKey: ["models"], queryFn: () => fetchModels(), staleTime: 1000 * 60 * 30 });
  const models = modelsQ.data ?? DEFAULT_MODELS;

  const [sel, setSel] = useState<{ provider: ProviderId; model: string }>(DEFAULT_SELECTION);
  const [web, setWeb] = useState(true);
  const selRef = useRef({ ...sel, web });
  selRef.current = { ...sel, web };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const v = JSON.parse(raw) as { provider: unknown; model: unknown; web?: unknown };
        if (isProviderId(v.provider) && typeof v.model === "string") setSel({ provider: v.provider, model: v.model });
        if (typeof v.web === "boolean") setWeb(v.web);
      }
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...sel, web }));
  }, [sel, web]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        body: () => ({ threadId, ...selRef.current }),
      }),
    [threadId],
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (err) => toast.error(err.message || "উত্তর আনা যায়নি"),
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      qc.setQueryData(["messages", threadId], undefined);
      qc.removeQueries({ queryKey: ["messages", threadId] });
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  const providerInfo = PROVIDERS.find((p) => p.id === sel.provider)!;
  const webSupported = sel.provider !== "groq";

  function send(text: string) {
    if (!text.trim() || busy) return;
    sendMessage({ text });
  }

  return (
    <div className="flex h-full flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-4 pt-14 pb-6 md:pt-8">
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <img src={mark} alt="" width={96} height={96} className="size-24 drop-shadow-[0_0_30px_var(--primary)]" />
              <h2 className="mt-4 font-display text-3xl font-semibold">
                কী নিয়ে <span className="text-gold">ভাবছেন?</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{providerInfo.webSearch}</p>
              <div className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2">
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
            </ConversationEmptyState>
          ) : (
            messages.map((m) => <ChatMessage key={m.id} message={m} />)
          )}
          {status === "submitted" && (
            <div className="flex items-center gap-3 py-2">
              <img src={mark} alt="" width={24} height={24} className="size-6 animate-pulse" />
              <Shimmer>ভাবছি…</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <PromptInput
          onSubmit={(msg) => send(msg.text)}
          className="rounded-2xl border bg-card/80 shadow-gold backdrop-blur"
        >
          <PromptInputBody>
            <PromptInputTextarea ref={textareaRef} autoFocus placeholder="Sapience-কে যেকোনো কিছু জিজ্ঞেস করুন…" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools className="flex-wrap">
              <ModelPicker
                provider={sel.provider}
                model={sel.model}
                models={models}
                loading={modelsQ.isLoading}
                onChange={(provider, model) => setSel({ provider, model })}
              />
              <PromptInputButton
                onClick={() => setWeb((w) => !w)}
                disabled={!webSupported}
                className={cn(web && webSupported ? "text-primary" : "text-muted-foreground")}
              >
                <Globe className="size-4" />
                <span className="hidden text-xs sm:inline">{web && webSupported ? "ইন্টারনেট চালু" : "ইন্টারনেট বন্ধ"}</span>
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Sapience AI ভুল করতে পারে — গুরুত্বপূর্ণ তথ্য যাচাই করে নিন।
        </p>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: UIMessage }) {
  const sources = message.parts.filter((p) => p.type === "source-url");
  return (
    <Message from={message.role}>
      <MessageContent
        className={cn(
          message.role === "user" &&
            "group-[.is-user]:bg-user-bubble group-[.is-user]:text-user-bubble-foreground rounded-2xl",
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return message.role === "user" ? (
              <p key={i} className="whitespace-pre-wrap">
                {part.text}
              </p>
            ) : (
              <MessageResponse key={i}>{part.text}</MessageResponse>
            );
          }
          if (part.type === "reasoning" && part.text) {
            return (
              <details key={i} className="mb-2 text-xs text-muted-foreground">
                <summary className="cursor-pointer">চিন্তার ধাপ</summary>
                <p className="mt-1 whitespace-pre-wrap">{part.text}</p>
              </details>
            );
          }
          return null;
        })}
        {sources.length > 0 && (
          <Sources>
            <SourcesTrigger count={sources.length} />
            <SourcesContent>
              {sources.map((s, i) =>
                s.type === "source-url" ? <Source key={i} href={s.url} title={s.title ?? s.url} /> : null,
              )}
            </SourcesContent>
          </Sources>
        )}
      </MessageContent>
    </Message>
  );
}
