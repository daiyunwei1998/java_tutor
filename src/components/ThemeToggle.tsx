"use client";

import { setTheme, useResolvedTheme } from "@/lib/theme";

export function ThemeToggle() {
  const theme = useResolvedTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={next === "dark" ? "Switch to dark mode" : "Switch to light mode"}
      title={next === "dark" ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span aria-hidden>{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
