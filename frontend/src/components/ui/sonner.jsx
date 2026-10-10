import React, { useSyncExternalStore } from "react";
import { Toaster as Sonner } from "sonner";
import { CheckCircle2, Info, AlertTriangle, AlertOctagon, Loader2 } from "lucide-react";

const subscribeToDocumentTheme = (onChange) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};

const getDocumentTheme = () =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

const getServerTheme = () => "light";

export function Toaster({ ...props }) {
  const theme = useSyncExternalStore(subscribeToDocumentTheme, getDocumentTheme, getServerTheme);

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="size-4 text-emerald-500" />,
        info: <Info className="size-4 text-blue-500" />,
        warning: <AlertTriangle className="size-4 text-amber-500" />,
        error: <AlertOctagon className="size-4 text-rose-500" />,
        loading: <Loader2 className="size-4 animate-spin text-blue-500" />,
      }}
      {...props}
    />
  );
}
