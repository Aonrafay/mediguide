"use client";

import { useFormStatus } from "react-dom";

import { toggleFavourite } from "@/lib/actions/engagement";

function HeartButton({ filled, pending }: { filled: boolean; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      title={filled ? "Remove from favourites" : "Add to favourites"}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        filled
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-500"
      } ${pending ? "opacity-60" : ""}`}
    >
      <span>{filled ? "❤️" : "🤍"}</span>
      {filled ? "Favourite" : "Add to favourites"}
    </button>
  );
}

/** Heart toggle — posts to the server action with the page path for revalidation. */
export default function FavouriteButton({
  doctorId,
  path,
  filled,
}: {
  doctorId: string;
  path: string;
  filled: boolean;
}) {
  return (
    <form action={toggleFavourite} className="inline">
      <input type="hidden" name="doctorId" value={doctorId} />
      <input type="hidden" name="path" value={path} />
      <PendingWrapper filled={filled} />
    </form>
  );
}

function PendingWrapper({ filled }: { filled: boolean }) {
  const { pending } = useFormStatus();
  return <HeartButton filled={filled} pending={pending} />;
}
