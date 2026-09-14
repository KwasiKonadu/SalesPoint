"use client";

import { type ReactNode } from "react";
import { Mail, MapPin, Pencil, Phone, Trash2, UserPlus } from "lucide-react";

import { Avatar } from "@/components/atoms/avatar";
import { cn } from "@/lib/utils";

// ==================== Pill ====================

const PILL_COLORS = {
  green:
    "border-emerald-400 text-emerald-600 dark:border-emerald-500/60 dark:text-emerald-400",
  yellow:
    "border-amber-300 text-amber-700 dark:border-amber-500/50 dark:text-amber-400",
  red: "border-red-300 text-red-600 dark:border-red-500/50 dark:text-red-400",
  blue: "border-blue-300 text-blue-700 dark:border-blue-500/50 dark:text-blue-400",
  gray: "border-border text-muted-foreground",
} as const;

export type PillColor = keyof typeof PILL_COLORS;

function Pill({
  color,
  icon,
  children,
}: {
  color: PillColor;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        PILL_COLORS[color],
      )}
    >
      {icon}
      {children}
    </span>
  );
}

// ==================== ContactCard ====================

export interface ContactCardDetail {
  label: string;
  value: string;
  /** Optional leading dot colour (any CSS colour). */
  dotColor?: string;
}

interface ContactCardProps {
  name: string;
  avatarUrl?: string;
  subtitle?: string;
  location?: string;
  statusPill?: { label: string; color: PillColor };
  details?: ContactCardDetail[];
  email?: string;
  phone?: string;
  /** Floating notification badge that reveals its label on hover. */
  badge?: { count: number; label: string };
  onClick?: () => void;
  onAddPerson?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function ContactCard({
  name,
  avatarUrl,
  subtitle,
  location,
  statusPill,
  details,
  email,
  phone,
  badge,
  onClick,
  onAddPerson,
  onEdit,
  onDelete,
  className,
}: ContactCardProps) {
  const hasActions = Boolean(onAddPerson || onEdit || onDelete);
  const hasContact = Boolean(email || phone);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex h-full w-80 flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-lg transition-all duration-200",
        "hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* Floating notification badge, straddling the top border. */}
      {badge ? (
        <div className="absolute right-6 top-0 -translate-y-1/3">
          <div className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-background px-2 py-0.5 text-xs font-semibold text-amber-600 shadow-sm ring-1 ring-background dark:border-amber-500/50 dark:text-amber-400">
            <span className="tabular-nums">{badge.count}</span>
            <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-200 group-hover:grid-cols-[1fr]">
              <span className="overflow-hidden whitespace-nowrap">
                {badge.label}
              </span>
            </span>
          </div>
        </div>
      ) : null}

      {/* Hover-revealed action buttons. */}
      {hasActions ? (
        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {onAddPerson ? (
            <button
              type="button"
              aria-label="Add person"
              onClick={(e) => {
                e.stopPropagation();
                onAddPerson();
              }}
              className="rounded-md bg-muted p-1.5 text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-500/15"
            >
              <UserPlus size={15} />
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              aria-label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="rounded-md bg-muted p-1.5 text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            >
              <Pencil size={15} />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              aria-label="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded-md bg-muted p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15"
            >
              <Trash2 size={15} />
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={name} avatarUrl={avatarUrl} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate font-bold text-foreground">{name}</p>
          {subtitle ? (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-1.5">
            {location ? (
              <Pill color="green" icon={<MapPin size={12} />}>
                {location}
              </Pill>
            ) : null}
            {statusPill ? (
              <Pill color={statusPill.color}>{statusPill.label}</Pill>
            ) : null}
          </div>
        </div>
      </div>

      {/* Optional detail grid */}
      {details && details.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {details.map((detail) => (
            <div key={detail.label} className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{detail.label}</span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {detail.dotColor ? (
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: detail.dotColor }}
                  />
                ) : null}
                <span className="truncate">{detail.value}</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {hasContact ? (
        <>
          <hr className="border-border" />

          {/* Contact info */}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {email ? (
              <a
                href={`mailto:${email}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 truncate transition-colors hover:text-foreground"
              >
                <Mail size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate">{email}</span>
              </a>
            ) : null}
            {phone ? (
              <a
                href={`tel:${phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 truncate transition-colors hover:text-foreground"
              >
                <Phone size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate">{phone}</span>
              </a>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
