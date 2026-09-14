import { cn } from "@/lib/utils";

// Same colour identities used across the app.
const AVATAR_COLORS = [
  "#8b5cf6", // violet-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f97316", // orange-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
];

const SIZES = {
  sm: { box: "h-8 w-8", text: "text-xs", px: 32 },
  md: { box: "h-10 w-10", text: "text-sm", px: 40 },
  lg: { box: "h-14 w-14", text: "text-sm", px: 56 },
  xl: { box: "h-24 w-24", text: "text-2xl", px: 96 },
} as const;

export type AvatarSize = keyof typeof SIZES;

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Deterministic accent colour for a name. */
export function pickAvatarColor(name: string): string {
  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: AvatarSize;
  className?: string;
}

/** Circular avatar: the image when given, otherwise coloured initials. */
export function Avatar({ name, avatarUrl, size = "lg", className }: AvatarProps) {
  const { box, text, px } = SIZES[size];

  if (avatarUrl) {
    return (
      <div className={cn(box, "shrink-0 overflow-hidden rounded-full", className)}>
        <img
          src={avatarUrl}
          alt={name}
          width={px}
          height={px}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        box,
        "flex shrink-0 items-center justify-center rounded-full text-white",
        className,
      )}
      style={{ backgroundColor: pickAvatarColor(name) }}
    >
      <span className={cn(text, "font-semibold")}>{getInitials(name)}</span>
    </div>
  );
}
