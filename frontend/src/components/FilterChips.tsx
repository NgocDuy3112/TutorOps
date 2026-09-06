import { cn } from "@/lib/utils";

export type FilterChipOption = {
  value: string;
  label: string;
  count?: number;
};

/**
 * Single-select horizontal chip row (pattern from TuitionPage filters).
 * Tap the active chip's "all" option to clear, or another chip to switch.
 */
export function FilterChips({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-11 shrink-0 rounded-2xl border px-3 text-sm font-semibold transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-slate-200 bg-white text-slate-700",
            )}
          >
            {option.label}
            {option.count != null && (
              <span
                className={cn(
                  "ml-1",
                  active ? "text-primary-foreground/75" : "text-muted-foreground",
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
