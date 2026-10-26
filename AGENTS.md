<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Chat streaming lives in `src/routes/api/chat.ts` (verifies the bearer token and thread ownership itself); why: server routes stream AI SDK UI messages, server fns can't.
- Provider keys (GEMINI/OPENROUTER/GROQ) are server-only; model lists come live from provider APIs via `src/server/models.functions.ts` with fallbacks in `src/lib/providers.ts`; why: lists change often.
- Threads/messages are read/written from the browser under RLS; messages store AI SDK `UIMessage.parts` with the SDK id in `ui_id`; why: SDK ids are not UUIDs.
