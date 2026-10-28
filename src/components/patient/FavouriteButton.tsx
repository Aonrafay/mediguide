"use client";

import { useFormStatus } from "react-dom";

import { toggleFavourite } from "@/lib/actions/engagement";

function HeartButton({
  filled,
  pending,
  on,
  off,
}: {
  filled: boolean;
  pending: boolean;
  on: string;
  off: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      title={filled ? on : off}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        filled
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-500"
      } ${pending ? "opacity-60" : ""}`}
    >
      <span>{filled ? "❤️" : "🤍"}</span>
      {filled ? on : off}
    </button>
  );
}

/** Heart toggle — posts to the server action with the page path for revalidation. */
export default function FavouriteButton({
  doctorId,
  path,
  filled,
  labels,
}: {
  doctorId: string;
  path: string;
  filled: boolean;
  labels?: { on?: string; off?: string };
}) {
  const on = labels?.on ?? "Remove from favourites";
  const off = labels?.off ?? "Add to favourites";
  return (
    <form action={toggleFavourite} className="inline">
      <input type="hidden" name="doctorId" value={doctorId} />
      <input type="hidden" name="path" value={path} />
      <PendingWrapper filled={filled} on={on} off={off} />
    </form>
  );
}

function PendingWrapper({
  filled,
  on,
  off,
}: {
  filled: boolean;
  on: string;
  off: string;
}) {
  const { pending } = useFormStatus();
  return <HeartButton filled={filled} pending={pending} on={on} off={off} />;
}
