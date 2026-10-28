/**
 * Time-slot helpers — shared by the booking UI and the slot API.
 * An availability window like {startTime:"09:00", endTime:"12:00", slotDurationMin:30}
 * produces ["09:00","09:30","10:00",...].
 */

export function generateSlots(
  startTime: string,
  endTime: string,
  slotDurationMin: number
): string[] {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const slots: string[] = [];
  for (let t = toMinutes(startTime); t + slotDurationMin <= toMinutes(endTime); t += slotDurationMin) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}

/** 0 = Sunday ... 6 = Saturday (matches JS Date.getDay()). */
export function dayOfWeekName(day: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
}
