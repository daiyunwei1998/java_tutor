"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "java-tutor.theme";

/** Runs before first paint (inlined in <head>) so the saved theme never flashes. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

function systemTheme(): Theme {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function current(): Theme {
  if (typeof document === "undefined") return "light";
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : systemTheme();
}

/** The theme actually shown: the user's choice, otherwise the system setting. Updates live. */
export function useResolvedTheme(): Theme {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const update = () => setTheme(current());
    update();
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", update);
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq?.removeEventListener?.("change", update);
      obs.disconnect();
    };
  }, []);
  return theme;
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* private mode: choice lasts for this page only */
  }
}
