import type { Participant } from "../types";

/** A call date (`YYYY-MM-DD`) as local midnight, so it never shifts a day. */
export const callDay = (date: string) => `${date}T00:00:00`;

/** Today as `YYYY-MM-DD`, in the studio's own time zone. */
export const today = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

/** Two letters for an avatar; Arabic names take their first letter. */
export const initials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : [words[0]];
  return letters
    .map((w) => Array.from(w)[0])
    .join("")
    .toUpperCase();
};

/** The participant a speaker label was mapped to, if any. */
export const participantFor = (participants: Participant[], label: string | null) =>
  label ? participants.find((p) => p.label === label) : undefined;

/** "14m" or "1hr 5m". */
export const formatMinutes = (minutes: number | null, isAr: boolean) => {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return isAr ? `${m} د` : `${m}m`;
  return isAr ? `${h} س${m ? ` ${m} د` : ""}` : `${h}hr${m ? ` ${m}m` : ""}`;
};
