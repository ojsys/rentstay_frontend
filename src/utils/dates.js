/**
 * Local-date helpers for the stays calendars.
 *
 * Everything here deliberately avoids `toISOString()`. A Date built as
 * `new Date(y, m, d)` is local midnight, and in Lagos (UTC+1) that serialises
 * to the *previous* day in UTC — so `toISOString().slice(0,10)` silently
 * shifts every calendar cell back by one. All stay dates are plain calendar
 * days with no time component, so they are formatted and compared as local
 * `YYYY-MM-DD` strings, which also sort lexicographically.
 */

/** Date → 'YYYY-MM-DD' using local calendar fields. */
export const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** 'YYYY-MM-DD' → Date at local midnight. */
export const fromISODate = (str) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Today as 'YYYY-MM-DD', local. */
export const todayISO = () => toISODate(new Date());

/** Whole days between two 'YYYY-MM-DD' strings (b - a). */
export const nightsBetween = (a, b) =>
  Math.round((fromISODate(b) - fromISODate(a)) / 86400000);

/** Shift a 'YYYY-MM-DD' string by n days. */
export const addDays = (iso, n) => {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
};

/** First day of the month containing `date`, as a Date. */
export const startOfMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

/** Shift a Date by n months, normalised to the 1st. */
export const addMonths = (date, n) =>
  new Date(date.getFullYear(), date.getMonth() + n, 1);

/**
 * Calendar grid for a month: leading blanks so the 1st lands on its weekday,
 * then one entry per day. Trailing blanks are not padded — the grid rows
 * close themselves.
 */
export const monthGrid = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first.getDay(); i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
  return cells;
};

export const MONTH_LABEL = (date) =>
  date.toLocaleString(undefined, { month: 'long', year: 'numeric' });

export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Expand API availability into a Set of unavailable 'YYYY-MM-DD' nights.
 *
 * `blocked` ranges are inclusive of end_date (a host blocking one day sends
 * start === end). `busy` ranges come from confirmed bookings and are
 * half-open — the checkout day is free for the next guest to check in, which
 * matches the backend's overlap test.
 */
export const buildUnavailableSet = ({ blocked = [], busy = [] } = {}) => {
  const set = new Set();
  const walk = (start, end, inclusive) => {
    if (!start || !end) return;
    let cur = start;
    // Guard against malformed ranges looping forever.
    for (let i = 0; i < 800; i += 1) {
      if (inclusive ? cur > end : cur >= end) break;
      set.add(cur);
      cur = addDays(cur, 1);
    }
  };
  blocked.forEach((r) => walk(r.start_date, r.end_date, true));
  busy.forEach((r) => walk(r.start_date, r.end_date, false));
  return set;
};
