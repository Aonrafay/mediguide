"use client";

import { useState } from "react";

import { THEME_COOKIE, type Theme } from "@/lib/theme";

export default function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle dark mode"
      className="rounded-full border border-slate-200 px-2.5 py-1.5 text-sm transition hover:bg-slate-100"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
