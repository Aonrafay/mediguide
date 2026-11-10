"use client";

import { useState } from "react";

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸 Instagram",
  linkedin: "💼 LinkedIn",
  x: "🐦 X",
  facebook: "📘 Facebook",
  website: "🌐 Website",
};

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  BASIC: { label: "BASIC", className: "bg-slate-100 text-slate-700" },
  PRO: { label: "PRO", className: "bg-sky-100 text-sky-700" },
  PREMIUM: { label: "PREMIUM", className: "bg-amber-100 text-amber-700" },
  CUSTOM: { label: "CUSTOM", className: "bg-violet-100 text-violet-700" },
};

export type CatalogPackage = {
  id: string;
  name: string;
  tier: string;
  description: string;
  features: string[];
  platforms: string[];
  priceLabel: string;
  /** HOSPITAL | CLINIC | LAB | PHARMACY — empty array means "for everyone" */
  audiences: string[];
};

export type CatalogTab = { id: string; icon: string; label: string };

export default function ServiceCatalog({
  packages,
  tabs,
  requestLabel,
}: {
  packages: CatalogPackage[];
  tabs: CatalogTab[];
  requestLabel: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id ?? "ALL");

  const filtered = packages.filter(
    (pkg) =>
      active === "ALL" ||
      pkg.audiences.length === 0 ||
      pkg.audiences.includes(active)
  );

  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-6xl px-4">
        {/* Audience tabs */}
        <div
          className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-2 overflow-x-auto rounded-2xl bg-slate-100 p-1.5"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active === tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active === tab.id
                  ? "bg-teal-600 text-white shadow"
                  : "text-slate-600 hover:text-teal-700"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filtered packages */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {filtered.map((pkg) => {
            const badge = TIER_BADGES[pkg.tier] ?? TIER_BADGES.CUSTOM!;
            return (
              <div
                key={pkg.id}
                className={`flex flex-col rounded-3xl border p-6 ${
                  pkg.tier === "PREMIUM"
                    ? "border-amber-300 shadow-md"
                    : "border-slate-200"
                }`}
              >
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}
                >
                  {badge.label}
                </span>
                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {pkg.name}
                </h3>
                <p className="mt-2 text-2xl font-bold text-teal-700">
                  {pkg.priceLabel}
                </p>
                <p className="mt-2 text-sm text-slate-500">{pkg.description}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-teal-600">✔</span> {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {pkg.platforms.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                      {PLATFORM_ICONS[p] ?? p}
                    </span>
                  ))}
                </div>
                <a
                  href="#request"
                  className={`mt-6 block rounded-xl px-4 py-2.5 text-center font-semibold transition ${
                    pkg.tier === "PREMIUM"
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-teal-600 text-white hover:bg-teal-700"
                  }`}
                >
                  {requestLabel}
                </a>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              No packages in this category yet — check the other tabs.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
