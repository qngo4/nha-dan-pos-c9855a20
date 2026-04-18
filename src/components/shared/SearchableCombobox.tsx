import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboOption {
  id: string;
  label: string;
  sub?: string;
}

interface Props {
  value: string; // selected id; "" means none
  onChange: (id: string) => void;
  options: ComboOption[];
  placeholder?: string;
  emptyOptionLabel?: string;     // e.g. "Khách lẻ" — when selected => value=""
  showEmptyOption?: boolean;
  onCreateNew?: (initialQuery: string) => void; // open inline create drawer
  createLabel?: string;          // e.g. "Tạo NCC mới"
  disabled?: boolean;
  className?: string;
  invalid?: boolean;
}

export function SearchableCombobox({
  value, onChange, options, placeholder = "Tìm và chọn...",
  emptyOptionLabel, showEmptyOption,
  onCreateNew, createLabel = "Tạo mới",
  disabled, className, invalid,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selected = options.find((o) => o.id === value);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options.slice(0, 50);
    return options.filter(
      (o) => o.label.toLowerCase().includes(needle) || (o.sub ?? "").toLowerCase().includes(needle),
    ).slice(0, 50);
  }, [q, options]);

  const displayLabel = value === "" && showEmptyOption ? (emptyOptionLabel ?? "—") : (selected?.label ?? "");

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "w-full h-8 px-2 pr-7 text-sm border rounded-md bg-background text-left flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60",
          invalid && "border-danger",
        )}
      >
        <span className={cn("truncate", !displayLabel && "text-muted-foreground")}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2" />
      </button>

      {open && !disabled && (
        <div className="absolute z-40 left-0 right-0 top-full mt-1 bg-popover border rounded-md shadow-lg max-h-72 overflow-hidden flex flex-col animate-fade-in">
          <div className="p-1.5 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên, SĐT, mã..."
                className="w-full h-7 pl-7 pr-7 text-xs bg-background border rounded focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {q && (
                <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 scrollbar-thin">
            {showEmptyOption && (
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); setQ(""); }}
                className={cn("w-full px-3 py-1.5 text-xs text-left flex items-center justify-between hover:bg-muted/60", value === "" && "bg-muted")}
              >
                <span className="font-medium">{emptyOptionLabel}</span>
                {value === "" && <Check className="h-3 w-3 text-primary" />}
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                Không tìm thấy. {onCreateNew && "Bấm 'Tạo mới' bên dưới."}
              </div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { onChange(o.id); setOpen(false); setQ(""); }}
                  className={cn(
                    "w-full px-3 py-1.5 text-xs text-left flex items-center justify-between hover:bg-muted/60 border-b last:border-0",
                    o.id === value && "bg-muted",
                  )}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{o.label}</div>
                    {o.sub && <div className="text-[10px] text-muted-foreground truncate">{o.sub}</div>}
                  </div>
                  {o.id === value && <Check className="h-3 w-3 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>

          {onCreateNew && (
            <button
              type="button"
              onClick={() => { setOpen(false); onCreateNew(q); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary border-t hover:bg-muted/40"
            >
              <Plus className="h-3 w-3" /> {createLabel}{q ? ` "${q}"` : ""}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
