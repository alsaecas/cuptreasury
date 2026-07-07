import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-lime-300 bg-lime-300 text-zinc-950 hover:bg-lime-200 disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500",
  secondary:
    "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800 disabled:text-zinc-500",
  ghost:
    "border-transparent bg-transparent text-zinc-300 hover:bg-zinc-900 disabled:text-zinc-600",
  danger:
    "border-red-400/50 bg-red-500/10 text-red-100 hover:bg-red-500/20 disabled:text-zinc-500",
};

export function Button({
  className,
  children,
  icon,
  variant = "secondary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
