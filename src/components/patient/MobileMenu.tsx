"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Hamburger menu for small screens. `children` is the server-rendered panel
 * content (links, language switcher, auth buttons).
 */
export default function MobileMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu"
        className="rounded-full border border-slate-200 px-3 py-1.5 text-lg leading-none transition hover:bg-slate-100"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <div className="absolute end-0 top-12 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          {children}
        </div>
      )}
    </div>
  );
}
