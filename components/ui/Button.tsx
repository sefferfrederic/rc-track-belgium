import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export default function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-display text-sm font-semibold uppercase tracking-wide transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" &&
          "bg-flag-gradient text-track-bg shadow-glow hover:brightness-110",
        variant === "secondary" &&
          "border border-track-border bg-track-surface text-track-white hover:border-track-orange/60",
        variant === "ghost" && "text-track-muted hover:text-track-white",
        className
      )}
      {...props}
    />
  );
}
