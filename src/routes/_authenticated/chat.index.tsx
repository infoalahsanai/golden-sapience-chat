import { createFileRoute, redirect } from "@tanstack/react-router";
import { createThread, threadsQuery } from "@/lib/threads";

// /chat opens the most recent empty-titled thread or creates a new one, then navigates to its URL.
export const Route = createFileRoute("/_authenticated/chat/")({
  beforeLoad: async ({ context }) => {
    const threads = await context.queryClient.fetchQuery(threadsQuery);
    const fresh = threads.find((t) => t.title === "নতুন কথোপকথন");
    const id = fresh?.id ?? (await createThread());
    if (!fresh) await context.queryClient.invalidateQueries({ queryKey: ["threads"] });
    throw redirect({ to: "/chat/$threadId", params: { threadId: id }, replace: true });
  },
});
