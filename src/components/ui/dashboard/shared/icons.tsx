import { Icon } from "../../icon";
import type { IconComponent } from "../types";

const glyph = (name: string): IconComponent => function DashboardIcon({ className }) {
  return <Icon name={name} className={className} />;
};
export const ArrowUpRight = glyph("arrow-circle-up");
export const ArrowDownRight = glyph("arrow-circle-down");
export const Minus = glyph("minus");
export const CalendarClock = glyph("calendar");
export const CalendarDays = glyph("calendar");
export const CircleAlert = glyph("exclamation-circle");
export const Inbox = glyph("inbox");
export const RotateCw = glyph("sync");
