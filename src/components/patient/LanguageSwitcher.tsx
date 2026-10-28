"use client";

import { usePathname } from "next/navigation";

import { setLocale } from "@/lib/actions/i18n";

export type SwitcherLanguage = {
  code: string;
  nativeName: string;
  flag?: string;
};

export default function LanguageSwitcher({
  languages,
  current,
  variant = "pill",
}: {
  languages: SwitcherLanguage[];
  current: string;
  /** pill = header style (hidden on mobile); inline = always visible (mobile menu) */
  variant?: "pill" | "inline";
}) {
  const pathname = usePathname();

  return (
    <form
      action={setLocale}
      className={`${
        variant === "pill"
          ? "hidden items-center gap-1 rounded-full border border-slate-200 px-2 py-1 sm:inline-flex"
          : "flex w-full items-center gap-2 rounded-full bg-slate-50 px-3 py-2"
      }`}
    >
      <input type="hidden" name="path" value={pathname} />
      <span aria-hidden>🌐</span>
      <select
        name="locale"
        defaultValue={current}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="w-full bg-transparent text-sm font-medium text-slate-600 outline-none"
        aria-label="Language"
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag ? `${language.flag} ` : ""}
            {language.nativeName}
          </option>
        ))}
      </select>
    </form>
  );
}
