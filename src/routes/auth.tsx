import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import mark from "@/assets/sapience-mark.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "লগইন — Sapience AI" },
      { name: "description", content: "Sapience AI-তে লগইন বা নতুন অ্যাকাউন্ট খুলুন।" },
      { property: "og:title", content: "লগইন — Sapience AI" },
      { property: "og:description", content: "আপনার Sapience AI অ্যাকাউন্টে প্রবেশ করুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/chat" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/chat" },
        });
        if (error) throw error;
        toast.success("ইমেইল চেক করুন — নিশ্চিতকরণ লিংক পাঠানো হয়েছে।");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "সমস্যা হয়েছে");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("লগইন হয়নি, আবার চেষ্টা করুন");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/chat" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border bg-card/70 p-8 shadow-gold backdrop-blur">
        <img src={mark} alt="" width={64} height={64} className="mx-auto size-16" />
        <h1 className="mt-4 text-center font-display text-3xl font-semibold">Sapience AI</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {mode === "in" ? "আবার স্বাগতম" : "নতুন অ্যাকাউন্ট খুলুন"}
        </p>

        <div className="mt-6 space-y-2">
          <Button variant="outline" className="w-full" onClick={() => oauth("google")}>
            Google দিয়ে চালিয়ে যান
          </Button>
          <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>
            Continue with Lovable
          </button>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> অথবা <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Input type="email" required placeholder="ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            type="password"
            required
            minLength={6}
            placeholder="পাসওয়ার্ড"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "in" ? "লগইন" : "অ্যাকাউন্ট খুলুন"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "in" ? "অ্যাকাউন্ট নেই? নতুন খুলুন" : "আগে থেকেই অ্যাকাউন্ট আছে? লগইন"}
        </button>
      </div>
    </main>
  );
}
