import React from "react";
import { Check } from "lucide-react";

export function Checkbox({
  checked = false,
  onCheckedChange,
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={`peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "border-primary bg-primary text-primary-foreground" : "border-slate-300 dark:border-slate-700 bg-transparent"
      } ${className}`}
      {...props}
    >
      {checked && <Check className="size-3.5 stroke-[3]" />}
    </button>
  );
}
