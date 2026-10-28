import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { getDirection, getLocale } from "@/lib/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MediGuide — Find the right care, anywhere",
    template: "%s | MediGuide",
  },
  description:
    "MediGuide is a global medical directory: find hospitals, clinics, medical complexes and labs by country and city, explore doctor profiles, and book in-person or video consultations.",
};

// The root layout reads the locale cookie on every request (html lang/dir),
// so the whole app renders on demand — opt out of instant-navigation checks.
export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const dir = getDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
