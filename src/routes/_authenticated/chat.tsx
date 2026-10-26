import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, MessageSquare, Plus, Trash2, PanelLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createThread, threadsQuery } from "@/lib/threads";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import mark from "@/assets/sapience-mark.png";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "কথোপকথন — Sapience AI" },
      { name: "description", content: "Sapience AI-এর সাথে কথা বলুন।" },
      { property: "og:title", content: "কথোপকথন — Sapience AI" },
      { property: "og:description", content: "Sapience AI-এর সাথে কথা বলুন।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatLayout,
});

function ChatLayout() {
  const { data: threads = [] } = useQuery(threadsQuery);
  const params = useParams({ strict: false }) as { threadId?: string };
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  async function newThread() {
    try {
      const id = await createThread();
      await qc.invalidateQueries({ queryKey: ["threads"] });
      setOpen(false);
      navigate({ to: "/chat/$threadId", params: { threadId: id } });
    } catch {
      toast.error("নতুন কথোপকথন খোলা যায়নি");
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("threads").delete().eq("id", id);
    if (error) return toast.error("মুছে ফেলা যায়নি");
    await qc.invalidateQueries({ queryKey: ["threads"] });
    if (params.threadId === id) navigate({ to: "/chat" });
  }

  return (
    <div className="flex h-dvh">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r bg-sidebar transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link to="/" className="flex items-center gap-2 px-5 py-5">
          <img src={mark} alt="" width={32} height={32} className="size-8" />
          <span className="font-display text-lg font-semibold">Sapience AI</span>
        </Link>
        <div className="px-3">
          <Button onClick={newThread} className="w-full justify-start gap-2">
            <Plus className="size-4" /> নতুন কথোপকথন
          </Button>
        </div>
        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3">
          {threads.map((t) => (
            <div
              key={t.id}
              className={cn(
                "group flex items-center rounded-lg text-sm",
                params.threadId === t.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60",
              )}
            >
              <Link
                to="/chat/$threadId"
                params={{ threadId: t.id }}
                onClick={() => setOpen(false)}
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2"
              >
                <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{t.title}</span>
              </Link>
              <button
                type="button"
                aria-label="মুছুন"
                onClick={() => remove(t.id)}
                className="mr-1 rounded p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </nav>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="size-4" /> লগআউট
          </Button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-background/60 md:hidden" onClick={() => setOpen(false)} />}
      <main className="relative flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          aria-label="মেনু"
          onClick={() => setOpen(true)}
          className="absolute top-4 left-4 z-10 rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden"
        >
          <PanelLeft className="size-5" />
        </button>
        <Outlet />
      </main>
    </div>
  );
}
