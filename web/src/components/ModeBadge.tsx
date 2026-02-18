"use client";

export function ModeBadge({ mode }: { mode: "convex" | "mock" }) {
  return (
    <span className={`mode-badge mode-badge--${mode}`}>
      Mode: {mode}
    </span>
  );
}
