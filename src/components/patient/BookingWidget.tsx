"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { bookAppointment } from "@/lib/actions/booking";
import { formatFee } from "@/lib/utils";

const MODES = [
  { value: "IN_PERSON", key: "modeInPerson" as const },
  { value: "VIDEO", key: "modeVideo" as const },
] as const;

type Mode = (typeof MODES)[number]["value"];

/** Weekday short name for a YYYY-MM-DD date (UTC-safe). */
function dayLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  const label = date.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
  return label;
}

function dayNumber(dateStr: string) {
  return Number(dateStr.split("-")[2]);
}

function monthLabel(dateStr: string) {
  const [y, m] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
  return date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
}

export type BookingLabels = {
  pickDate: string;
  times: string;
  notes: string;
  confirm: string;
  booking?: string;
  signIn: string;
  noTimingsInPerson: string;
  noTimingsVideo: string;
  allBooked: string;
  pickFirst: string;
  modeInPerson: string;
  modeVideo: string;
  notAvailable: string;
};

const DEFAULT_LABELS: BookingLabels = {
  pickDate: "Pick a date",
  times: "Available times",
  notes: "Notes for the doctor (optional) — symptoms, questions…",
  confirm: "Confirm booking",
  booking: "Booking…",
  signIn: "Sign in to book",
  noTimingsInPerson:
    "The doctor has no in-person timings on this day — try another date or mode.",
  noTimingsVideo:
    "The doctor has no video timings on this day — try another date or mode.",
  allBooked: "All slots are booked on this day.",
  pickFirst: "Pick a date first.",
  modeInPerson: "🏥 In-Person Visit",
  modeVideo: "🎥 Video Consultation",
  notAvailable: "Not available",
};

export default function BookingWidget({
  doctorId,
  offersVideo,
  inPersonFee,
  videoFee,
  isLoggedIn,
  // Weekday (0-6) -> which modes have at least one window
  modeDays,
  initialError,
  initialDate,
  initialMode,
  labels: labelsProp,
}: {
  doctorId: string;
  offersVideo: boolean;
  inPersonFee: number;
  videoFee: number | null;
  isLoggedIn: boolean;
  modeDays: { IN_PERSON: number[]; VIDEO: number[] };
  initialError?: string;
  initialDate?: string;
  initialMode?: string;
  labels?: Partial<BookingLabels>;
}) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [mode, setMode] = useState<Mode>(
    initialMode === "VIDEO" && offersVideo ? "VIDEO" : "IN_PERSON"
  );
  const [dates, setDates] = useState<string[]>([]);
  const [date, setDate] = useState<string>(initialDate ?? "");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Next 14 days — computed after mount to avoid SSR/hydration mismatches
  useEffect(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + i)
      );
      list.push(d.toISOString().slice(0, 10));
    }
    setDates(list);
    if (!initialDate) setDate(list[0]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Which weekday index the selected date falls on
  const selectedWeekday = date
    ? new Date(`${date}T00:00:00Z`).getUTCDay()
    : -1;

  const hasWindowsForMode = (m: Mode) =>
    date !== "" && modeDays[m].includes(selectedWeekday);

  // Fetch free slots when date/mode change
  useEffect(() => {
    if (!date || !hasWindowsForMode(mode)) {
      setSlots(null);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSlot("");
    fetch(
      `/api/slots?doctorId=${doctorId}&date=${date}&mode=${mode}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSlots(Array.isArray(data.slots) ? data.slots : []);
      })
      .catch(() => {
        if (!cancelled) {
          setSlots([]);
          setLoadError("Could not load slots — try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, mode, doctorId]);

  const dateSupported = date !== "" && hasWindowsForMode(mode);

  return (
    <form action={bookAppointment} className="space-y-5">
      <input type="hidden" name="doctorId" value={doctorId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="timeSlot" value={slot} />
      <input type="hidden" name="mode" value={mode} />

      {/* Mode selector */}
      <div className="grid gap-2 sm:grid-cols-2">
        {MODES.map((m) => {
          const disabled = m.value === "VIDEO" && !offersVideo;
          const active = mode === m.value;
          return (
            <button
              key={m.value}
              type="button"
              disabled={disabled}
              onClick={() => setMode(m.value)}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                disabled
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                  : active
                    ? "border-teal-600 bg-teal-50 font-semibold text-teal-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-300"
              }`}
            >
              <span>{labels[m.key]}</span>
              <span className="block text-xs text-slate-500">
                {m.value === "IN_PERSON"
                  ? formatFee(inPersonFee)
                  : disabled
                    ? labels.notAvailable
                    : formatFee(videoFee)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Date chips */}
      <div>
        <p className="text-sm font-medium text-slate-700">{labels.pickDate}</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          {dates.length === 0 && (
            <div className="h-16 w-full animate-pulse rounded-lg bg-slate-100" />
          )}
          {dates.map((d) => {
            const weekday = new Date(`${d}T00:00:00Z`).getUTCDay();
            const supported = modeDays[mode].includes(weekday);
            const active = date === d;
            return (
              <button
                key={d}
                type="button"
                disabled={!supported}
                onClick={() => setDate(d)}
                title={supported ? undefined : "No timings on this day"}
                className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border text-center transition ${
                  !supported
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                    : active
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-300"
                }`}
              >
                <span className="text-[10px] uppercase">{dayLabel(d)}</span>
                <span className="text-lg font-bold leading-none">
                  {dayNumber(d)}
                </span>
                <span className="text-[10px]">{monthLabel(d)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      <div>
        <p className="text-sm font-medium text-slate-700">{labels.times}</p>
        {!date ? (
          <p className="mt-2 text-sm text-slate-400">{labels.pickFirst}</p>
        ) : !dateSupported ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {mode === "VIDEO" ? labels.noTimingsVideo : labels.noTimingsInPerson}
          </p>
        ) : slotsLoading ? (
          <div className="mt-2 h-10 w-full animate-pulse rounded-lg bg-slate-100" />
        ) : slots && slots.length > 0 ? (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {slots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlot(s)}
                className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                  slot === s
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-teal-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            {loadError ?? labels.allBooked}
          </p>
        )}
      </div>

      {/* Notes */}
      <textarea
        name="notes"
        rows={2}
        placeholder={labels.notes}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
      />

      {/* Errors from server action or API */}
      {(initialError || loadError) && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {initialError ?? loadError}
        </p>
      )}

      {isLoggedIn ? (
        <SubmitBooking
          label={labels.confirm}
          pendingLabel={labels.booking ?? labels.confirm}
        />
      ) : (
        <a
          href={`/login?next=/book/${doctorId}`}
          className="block w-full rounded-xl bg-teal-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-teal-700"
        >
          {labels.signIn}
        </a>
      )}
    </form>
  );
}

function SubmitBooking({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
