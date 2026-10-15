const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isCalendarDay(value: string): boolean {
  if (!DAY_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const utc = new Date(Date.UTC(year!, month! - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month! - 1 &&
    utc.getUTCDate() === day
  );
}

/** Calendar day (YYYY-MM-DD) of an instant in the given IANA timezone. */
export function calendarDay(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );

  return asUtc - instant.getTime();
}

/** UTC instant of 00:00:00 on a calendar day in the given timezone. */
export function startOfZonedDay(day: string, timeZone: string): Date {
  if (!isCalendarDay(day)) {
    throw new Error(`Invalid calendar day: ${day}`);
  }

  const utcGuess = new Date(`${day}T00:00:00.000Z`);
  const offset = timeZoneOffsetMs(utcGuess, timeZone);
  const start = new Date(utcGuess.getTime() - offset);

  if (calendarDay(start, timeZone) !== day) {
    const correctedOffset = timeZoneOffsetMs(start, timeZone);
    return new Date(utcGuess.getTime() - correctedOffset);
  }

  return start;
}

export function addCalendarDays(day: string, days: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year!, month! - 1, date! + days));
  const nextMonth = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(utc.getUTCDate()).padStart(2, "0");
  return `${utc.getUTCFullYear()}-${nextMonth}-${nextDay}`;
}

export function startOfZonedMonth(day: string, timeZone: string): Date {
  return startOfZonedDay(`${day.slice(0, 7)}-01`, timeZone);
}

export type ZonedRange = {
  from: string;
  to: string;
  start: Date;
  end: Date;
};

/** Inclusive calendar-day range converted to a half-open UTC interval. */
export function zonedRange(
  from: string,
  to: string,
  timeZone: string,
): ZonedRange {
  if (!isCalendarDay(from) || !isCalendarDay(to) || from > to) {
    throw new Error("Choose a valid date range.");
  }

  return {
    from,
    to,
    start: startOfZonedDay(from, timeZone),
    end: startOfZonedDay(addCalendarDays(to, 1), timeZone),
  };
}

export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    days.push(cursor);
    cursor = addCalendarDays(cursor, 1);
    if (days.length > 400) {
      break;
    }
  }
  return days;
}

export function expenseDateToUtc(day: string): Date {
  if (!isCalendarDay(day)) {
    throw new Error(`Invalid expense date: ${day}`);
  }
  return new Date(`${day}T00:00:00.000Z`);
}

export function formatExpenseDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
