"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useId,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldLabel } from "@/components/atoms/field-label";

export interface SearchSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchSelectProps {
  label?: string;
  placeholder?: string;
  options: SearchSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  /** Accepted for call-site compatibility; the control height is fixed (`h-9`). */
  size?: "sm" | "md";
  /** Fires on every keystroke — drive async option sources from here. */
  onQueryChange?: (query: string) => void;
  /** Rendered inside the control's box, alongside the clear / chevron icons. */
  rightSlot?: React.ReactNode;
  /** Show the clear (X) button when a value is selected. Default `true`. */
  clearable?: boolean;
  /** Prepend a selectable "All" option (value `''`) for filter bars. */
  showAllOption?: boolean;
  /** Label for the "All" option. Defaults to `All {placeholder}`. */
  allLabel?: string;
  /** Replaces the "No results found" message; gets the query and a `close` fn. */
  emptyState?: (ctx: { query: string; close: () => void }) => React.ReactNode;
  id?: string;
  disabled?: boolean;
}

function useAnchoredPosition(
  open: boolean,
  ref: React.RefObject<HTMLElement | null>,
) {
  const [pos, setPos] = useState({
    left: 0,
    width: 0,
    top: undefined as number | undefined,
    bottom: undefined as number | undefined,
    maxHeight: 240,
  });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const above = r.top;
    const openUp = below < 260 && above > below;
    setPos({
      left: r.left,
      width: r.width,
      top: openUp ? undefined : r.bottom + 4,
      bottom: openUp ? window.innerHeight - r.top + 4 : undefined,
      maxHeight: Math.max(140, Math.min(280, (openUp ? above : below) - 16)),
    });
  }, [ref]);

  useEffect(() => {
    if (!open) return;
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, update]);

  return { pos, update };
}

/**
 * Searchable single-select combobox: type to filter, full keyboard nav, dropdown
 * portaled to `<body>` so it escapes clipped / transformed ancestors.
 */
export function SearchSelect({
  label,
  placeholder = "Select or type to search…",
  options,
  value,
  onChange,
  error,
  onQueryChange,
  rightSlot,
  clearable = true,
  showAllOption = false,
  allLabel,
  emptyState,
  id,
  disabled,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  // `showDropdown` keeps the panel mounted through its closing transition;
  // `expanded` drives the grid-rows/opacity flow one frame behind `open`.
  const [showDropdown, setShowDropdown] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listboxId = useId();
  const { pos, update } = useAnchoredPosition(open, containerRef);

  const effectiveOptions = useMemo(
    () =>
      showAllOption
        ? [{ value: "", label: allLabel ?? `All ${placeholder}` }, ...options]
        : options,
    [options, showAllOption, allLabel, placeholder],
  );

  const selected = effectiveOptions.find((o) => o.value === value);
  const inputDisplay = open ? query : (selected?.label ?? "");

  const filtered = useMemo(() => {
    if (!query) return effectiveOptions;
    const q = query.toLowerCase();
    return effectiveOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(q)),
    );
  }, [effectiveOptions, query]);

  // Keep the highlight in range as the list changes (adjust during render).
  const [prevFiltered, setPrevFiltered] = useState(filtered);
  if (filtered !== prevFiltered) {
    setPrevFiltered(filtered);
    setHighlighted(filtered.length > 0 ? 0 : -1);
  }

  const openDropdown = () => {
    if (disabled) return;
    update();
    setOpen(true);
    setShowDropdown(true);
    // Start the highlight on the current value (or the first row) so Enter works
    // straight away, before the user types anything.
    const selIdx = effectiveOptions.findIndex((o) => o.value === value);
    setHighlighted(selIdx >= 0 ? selIdx : effectiveOptions.length > 0 ? 0 : -1);
  };
  const closeDropdown = () => {
    setOpen(false);
    setExpanded(false);
    setQuery("");
  };

  // Flip `expanded` on one frame after mount so the browser has a 0fr state to
  // transition from — otherwise it just pops in at full height.
  useEffect(() => {
    if (!showDropdown || !open) return;
    const raf = requestAnimationFrame(() => setExpanded(true));
    return () => cancelAnimationFrame(raf);
  }, [showDropdown, open]);

  const handleDropdownTransitionEnd = (e: React.TransitionEvent) => {
    if (!open && e.propertyName === "grid-template-rows")
      setShowDropdown(false);
  };

  useEffect(() => {
    if (!open) return;
    optionRefs.current[highlighted]?.scrollIntoView({ block: "nearest" });
  }, [highlighted, open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (containerRef.current?.contains(t) || dropdownRef.current?.contains(t))
        return;
      closeDropdown();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Radix's Dialog/Sheet scroll-lock (react-remove-scroll) preventDefault()s any
  // wheel/touchmove whose target isn't inside the dialog's own subtree. This
  // dropdown is portaled to <body>, so its list can't scroll inside a form
  // panel — keep those events from bubbling to the document-level blocker.
  useEffect(() => {
    const el = dropdownRef.current;
    if (!showDropdown || !el) return;
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener("wheel", stop, { passive: true });
    el.addEventListener("touchmove", stop, { passive: true });
    return () => {
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchmove", stop);
    };
  }, [showDropdown]);

  const handleSelect = (opt: SearchSelectOption) => {
    onChange?.(opt.value);
    closeDropdown();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        openDropdown();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((i) =>
          filtered.length ? (i + 1) % filtered.length : -1,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((i) =>
          filtered.length ? (i - 1 + filtered.length) % filtered.length : -1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlighted >= 0 && filtered[highlighted])
          handleSelect(filtered[highlighted]);
        break;
      case "Escape":
        e.preventDefault();
        closeDropdown();
        break;
      case "Home":
        if (filtered.length) {
          e.preventDefault();
          setHighlighted(0);
        }
        break;
      case "End":
        if (filtered.length) {
          e.preventDefault();
          setHighlighted(filtered.length - 1);
        }
        break;
    }
  };

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <FieldLabel htmlFor={id} title={label}>
          {label}
        </FieldLabel>
      )}

      <div
        className={cn(
          "flex h-9 items-center rounded-md border bg-transparent px-3 shadow-xs transition-colors dark:bg-input/30",
          open
            ? "border-ring ring-ring/50 ring-[3px]"
            : error
              ? "border-destructive"
              : "border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputDisplay}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            onQueryChange?.(e.target.value);
            if (!open) openDropdown();
          }}
          // Deliberately no onFocus handler: focusing the field (Tab, or a
          // Sheet/Dialog auto-focusing its first control) must not fling the
          // dropdown open. It opens on click, on typing, or on ArrowDown/Enter.
          onClick={() => {
            if (!open) openDropdown();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && highlighted >= 0
              ? `${listboxId}-option-${highlighted}`
              : undefined
          }
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />

        <div className="ml-2 flex shrink-0 items-center gap-1">
          {rightSlot}
          {clearable && value && !open && (
            <button
              type="button"
              aria-label="Clear"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.("");
                closeDropdown();
              }}
              className="p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Toggle options"
            onClick={() => {
              if (open) closeDropdown();
              else {
                openDropdown();
                inputRef.current?.focus();
              }
            }}
            className="p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {showDropdown &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            data-search-select-portal=""
            onTransitionEnd={handleDropdownTransitionEnd}
            style={{
              position: "fixed",
              // Modal Sheets/Dialogs (Radix) set `body { pointer-events: none }`
              // while open and only restore `auto` on their own content subtree.
              // This portal is a sibling of that subtree (mounted straight to
              // <body>), so without this override it silently inherits `none`
              // inside a form panel — un-hoverable, clicks fall through to
              // whatever is visually behind it.
              pointerEvents: "auto",
              left: pos.left,
              width: pos.width,
              top: pos.top,
              bottom: pos.bottom,
              gridTemplateRows: expanded ? "1fr" : "0fr",
              opacity: expanded ? 1 : 0,
            }}
            className="z-50 grid transition-[grid-template-rows,opacity] duration-300 ease-out"
          >
            <div className="min-h-0 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
              <div
                id={listboxId}
                role="listbox"
                className="overflow-y-auto py-1"
                style={{ maxHeight: pos.maxHeight }}
              >
                {filtered.length === 0 ? (
                  emptyState ? (
                    emptyState({ query, close: closeDropdown })
                  ) : (
                    <p className="px-4 py-3 text-center text-sm text-muted-foreground">
                      No results found
                    </p>
                  )
                ) : (
                  filtered.map((opt, idx) => (
                    <button
                      key={opt.value}
                      id={`${listboxId}-option-${idx}`}
                      role="option"
                      aria-selected={opt.value === value}
                      ref={(el) => {
                        optionRefs.current[idx] = el;
                      }}
                      type="button"
                      // Select on mousedown (before the input blurs / the panel
                      // starts closing) — `preventDefault` keeps focus on the input.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(opt);
                      }}
                      onMouseEnter={() => setHighlighted(idx)}
                      className={cn(
                        "flex w-full flex-col px-4 py-2 text-left text-sm transition-colors",
                        opt.value === value
                          ? "bg-accent font-medium text-accent-foreground"
                          : cn(
                              "hover:bg-accent",
                              idx === highlighted && "bg-accent",
                            ),
                      )}
                    >
                      <span>{opt.label}</span>
                      {opt.sublabel && (
                        <span className="mt-0.5 text-xs text-muted-foreground">
                          {opt.sublabel}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
