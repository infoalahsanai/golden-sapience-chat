import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, Brain, Layers, ShieldCheck } from "lucide-react";
import mark from "@/assets/sapience-mark.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sapience AI — মানুষের মতো বোঝে, ইন্টারনেট থেকে জানে" },
      {
        name: "description",
        content: "Gemini, OpenRouter ও Groq-এর শক্তিশালী মডেল আর লাইভ ইন্টারনেট সার্চ নিয়ে Sapience AI।",
      },
      { property: "og:title", content: "Sapience AI" },
      { property: "og:description", content: "মানুষের মতো বোঝে, লাইভ ইন্টারনেট থেকে জানে — শত শত AI মডেল এক জায়গায়।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Brain, title: "মানুষের মতো বোঝে", text: "আবেগ, প্রসঙ্গ আর মনের কথা — A থেকে Z সবকিছু।" },
  { icon: Globe, title: "লাইভ ইন্টারনেট", text: "Google Search ও ওয়েব সার্চ দিয়ে এই মুহূর্তের তথ্য, সূত্রসহ।" },
  { icon: Layers, title: "শত শত মডেল", text: "Gemini, OpenRouter ও Groq — সরাসরি তালিকা থেকে বেছে নিন।" },
  { icon: ShieldCheck, title: "আপনার ইতিহাস নিরাপদ", text: "প্রতিটি কথোপকথন আপনার অ্যাকাউন্টে সংরক্ষিত।" },
];

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img src={mark} alt="" width={36} height={36} className="size-9" />
          <span className="font-display text-xl font-semibold">Sapience AI</span>
        </div>
        <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
          লগইন
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-16 pb-20 text-center">
        <img src={mark} alt="Sapience AI" width={160} height={160} className="mx-auto size-36 drop-shadow-[0_0_40px_var(--primary)]" />
        <h1 className="mt-8 font-display text-5xl leading-tight font-semibold md:text-7xl">
          চিন্তা করে <span className="text-gold">মানুষের মতো</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Sapience AI প্রশ্নের পেছনের মানে বোঝে, ইন্টারনেট থেকে সর্বশেষ তথ্য খুঁজে আনে, আর বিশ্বের সেরা মডেলগুলো দিয়ে উত্তর দেয়।
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link
            to="/chat"
            className="rounded-full bg-gold px-8 py-3 font-semibold text-primary-foreground shadow-gold transition-transform hover:scale-[1.03]"
          >
            শুরু করুন
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border bg-card/60 p-6 backdrop-blur">
            <f.icon className="size-6 text-primary" />
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
