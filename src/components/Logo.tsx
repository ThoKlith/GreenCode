import React from "react";

export interface LogoProps {
  withText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  badgeClassName?: string;
  textClassName?: string;
}

export function Logo({
  withText = true,
  size = "md",
  className = "",
  badgeClassName = "",
  textClassName = "",
}: LogoProps) {
  const sizeStyles = {
    sm: {
      badge: "h-7 w-7 rounded-lg text-sm",
      text: "text-lg",
      gap: "gap-2",
      glow: "shadow-[0_0_12px_rgba(16,185,129,0.5)]",
    },
    md: {
      badge: "h-9 w-9 rounded-xl text-lg",
      text: "text-xl sm:text-2xl",
      gap: "gap-2.5",
      glow: "shadow-[0_0_18px_rgba(16,185,129,0.55)]",
    },
    lg: {
      badge: "h-12 w-12 rounded-2xl text-2xl",
      text: "text-3xl sm:text-4xl",
      gap: "gap-3.5",
      glow: "shadow-[0_0_24px_rgba(16,185,129,0.6)]",
    },
    xl: {
      badge: "h-16 w-16 rounded-2xl text-4xl",
      text: "text-5xl",
      gap: "gap-4",
      glow: "shadow-[0_0_32px_rgba(16,185,129,0.65)]",
    },
  };

  const current = sizeStyles[size] || sizeStyles.md;

  return (
    <span className={`inline-flex items-center select-none ${current.gap} ${className}`}>
      {/* Green "A" Energy Class Badge */}
      <span
        className={`relative inline-flex items-center justify-center shrink-0 font-sans font-black leading-none bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-[#052014] border border-emerald-300/30 ${current.badge} ${current.glow} ${badgeClassName}`}
        aria-hidden="true"
      >
        A
      </span>

      {/* Brand Wordmark */}
      {withText && (
        <span
          className={`font-extrabold tracking-tight whitespace-nowrap leading-none ${current.text} ${textClassName}`}
        >
          <span className="text-white">Green</span>
          <span className="text-emerald-400">Code</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
