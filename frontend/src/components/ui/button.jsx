import React from "react";

export function Button({
  children,
  className = "",
  variant = "default",
  size = "default",
  disabled = false,
  onClick,
  type = "button",
  ...props
}) {
  let baseClass = "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50";

  let variantClass = "bg-primary text-primary-foreground hover:bg-primary/80";
  if (variant === "outline") {
    variantClass = "border-border bg-background hover:bg-muted hover:text-foreground";
  } else if (variant === "destructive") {
    variantClass = "bg-destructive/10 text-destructive hover:bg-destructive/20";
  } else if (variant === "ghost") {
    variantClass = "hover:bg-muted hover:text-foreground";
  }

  let sizeClass = "h-8 gap-1.5 px-2.5";
  if (size === "sm") {
    sizeClass = "h-7 gap-1 px-2.5 text-[0.8rem]";
  } else if (size === "xs") {
    sizeClass = "h-6 gap-1 px-2 text-xs";
  } else if (size === "lg") {
    sizeClass = "h-9 gap-1.5 px-2.5";
  } else if (size === "icon") {
    sizeClass = "size-8";
  }

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
