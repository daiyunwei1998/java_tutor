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
      aria-label={next === "dark" ? "切換成深色模式" : "切換成淺色模式"}
      title={next === "dark" ? "切換成深色模式" : "切換成淺色模式"}
    >
      <span aria-hidden>{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
