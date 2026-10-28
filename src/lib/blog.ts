/** Blog categories (plain constants — not a "use server" module). */
export const BLOG_CATEGORIES = [
  "General Health",
  "Nutrition",
  "Mental Health",
  "Child Health",
  "Preventive Care",
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  "General Health": "🩺",
  Nutrition: "🥗",
  "Mental Health": "🧠",
  "Child Health": "🧒",
  "Preventive Care": "🛡️",
};
