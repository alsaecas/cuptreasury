import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "green" | "amber" | "red" | "blue" | "neutral";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const tones: Record<BadgeTone, string> = {
  green: "border-lime-300/30 bg-lime-300/10 text-lime-100",
  amber: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  red: "border-red-300/30 bg-red-300/10 text-red-100",
  blue: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  neutral: "border-zinc-700 bg-zinc-900 text-zinc-300",
};

export function Badge({ children, className, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
