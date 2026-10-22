import { Linking } from "react-native";
import * as Calendar from "expo-calendar/legacy";
import type { Event } from "@/lib/mock-data";

function parseTime(t?: string): [number, number] {
  const m = (t ?? "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return [9, 0];
  let h = parseInt(m[1], 10);
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return [Math.min(h, 23), Math.min(parseInt(m[2], 10), 59)];
}

export function eventTimes(e: Pick<Event, "date" | "endDate" | "time">): { start: Date; end: Date } {
  const [y, mo, d] = e.date.split("-").map(Number);
  const [h, mi] = parseTime(e.time);
  const start = new Date(y, mo - 1, d, h, mi, 0);
  let end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // default length: 2 hours
  if (e.endDate && e.endDate !== e.date) {
    const [ey, emo, ed] = e.endDate.split("-").map(Number);
    end = new Date(ey, emo - 1, ed, 18, 0, 0);
  }
  return { start, end };
}

const plain = (html?: string) =>
  (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);

const pad = (n: number) => String(n).padStart(2, "0");
const fmtLocal = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

function googleUrl(e: Event): string {
  const { start, end } = eventTimes(e);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${fmtLocal(start)}/${fmtLocal(end)}`,
    details: plain(e.description),
    location: e.venue ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Opens the phone's own "new calendar event" screen, pre-filled. Falls back to Google Calendar.
export async function addEventToCalendar(e: Event): Promise<void> {
  const { start, end } = eventTimes(e);
  try {
    await Calendar.createEventInCalendarAsync({
      title: e.title,
      startDate: start,
      endDate: end,
      location: e.venue,
      notes: plain(e.description),
    });
  } catch (err) {
    console.warn("Native calendar failed, opening Google Calendar:", String(err));
    await Linking.openURL(googleUrl(e));
  }
}
