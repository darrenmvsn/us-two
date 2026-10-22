/**
 * Calendar days in the couple's own time zone. A day is a `YYYY-MM-DD` key,
 * so comparing and sorting days is comparing strings.
 */

export type DayKey = string;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone || timeZone.length > 64) return false;
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

function parts(timeZone: string, at: Date): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of formatterFor(timeZone).formatToParts(at)) if (p.type !== 'literal') out[p.type] = Number(p.value);
  return out;
}

export function dayKeyIn(timeZone: string, at: Date): DayKey {
  const p = parts(timeZone, at);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function previousDayKey(day: DayKey): DayKey {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Milliseconds until the next local midnight (to the minute; a DST night is an hour off, which only moves a countdown). */
export function msUntilNextDay(timeZone: string, now: Date): number {
  const p = parts(timeZone, now);
  const elapsed = ((p.hour ?? 0) * 3600 + (p.minute ?? 0) * 60 + (p.second ?? 0)) * 1000;
  return Math.max(60_000, 86_400_000 - elapsed);
}
