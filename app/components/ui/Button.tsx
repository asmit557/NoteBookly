"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ComponentPropsWithoutRef, forwardRef, useState } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base: Record<Variant, string> = {
  primary:
    "bg-[--accent] text-white shadow-[0_0_24px_rgba(108,99,255,0.3)] hover:shadow-[0_0_36px_rgba(108,99,255,0.5)]",
  secondary:
    "border border-[--border-strong] bg-[--surface] text-[--foreground] hover:bg-[--surface-hover] hover:border-[--accent-muted]",
  ghost:
    "text-[--muted-light] hover:text-[--foreground] hover:bg-[--surface]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-4 text-xs gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, children, className = "", disabled, ...props }, ref) => {
    const reduced = useReducedMotion();
    const [hovered, setHovered] = useState(false);
    const isPrimary = variant === "primary";

    return (
      <motion.button
        ref={ref}
        whileHover={reduced ? undefined : { scale: 1.02 }}
        whileTap={reduced ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        disabled={disabled || loading}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className={[
          "relative inline-flex items-center justify-center rounded-lg font-medium overflow-hidden",
          "transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[--accent] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]",
          "disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none",
          base[variant],
          sizes[size],
          className,
        ].join(" ")}
        {...(props as ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {/* Shimmer — primary only */}
        {isPrimary && !reduced && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/15 to-transparent"
            animate={hovered ? { translateX: "200%" } : { translateX: "-100%" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        )}

        {/* Spinner */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </span>
        )}

        <span className={loading ? "invisible" : "relative flex items-center gap-[inherit]"}>
          {children}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
