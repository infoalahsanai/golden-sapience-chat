import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { PROVIDERS, type ModelOption, type ProviderId } from "@/lib/providers";
import { cn } from "@/lib/utils";

type Props = {
  provider: ProviderId;
  model: string;
  models: Record<ProviderId, ModelOption[]>;
  loading: boolean;
  onChange: (provider: ProviderId, model: string) => void;
};

export function ModelPicker({ provider, model, models, loading, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = models[provider]?.find((m) => m.id === model);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex rounded-lg border bg-background/40 p-0.5">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              const first = models[p.id]?.[0];
              if (first) onChange(p.id, first.id);
            }}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              provider === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.name.replace("Google ", "")}
          </button>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex max-w-[14rem] items-center gap-1 rounded-lg border bg-background/40 px-2.5 py-1 text-xs hover:bg-accent"
          >
            <span className="truncate">{loading ? "লোড হচ্ছে…" : (current?.label ?? model)}</span>
            <ChevronsUpDown className="size-3 shrink-0 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="মডেল খুঁজুন…" />
            <CommandList>
              <CommandEmpty>কোনো মডেল পাওয়া যায়নি</CommandEmpty>
              <CommandGroup heading={`${PROVIDERS.find((p) => p.id === provider)?.name} · ${models[provider]?.length ?? 0} মডেল`}>
                {(models[provider] ?? []).map((m) => (
                  <CommandItem
                    key={m.id}
                    value={`${m.label} ${m.id}`}
                    onSelect={() => {
                      onChange(provider, m.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("size-3.5", m.id === model ? "opacity-100" : "opacity-0")} />
                    <div className="min-w-0">
                      <div className="truncate text-sm">{m.label}</div>
                      <div className="truncate text-xs text-muted-foreground">{m.id}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
