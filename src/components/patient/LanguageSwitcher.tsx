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
}: {
  languages: SwitcherLanguage[];
  current: string;
}) {
  const pathname = usePathname();

  return (
    <form
      action={setLocale}
      className="hidden items-center gap-1 rounded-full border border-slate-200 px-2 py-1 sm:inline-flex"
    >
      <input type="hidden" name="path" value={pathname} />
      <span aria-hidden>🌐</span>
      <select
        name="locale"
        defaultValue={current}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="bg-transparent py-0.5 pl-0 pr-1 text-sm font-medium text-slate-600 outline-none"
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
