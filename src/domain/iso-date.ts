interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function parseIsoDate(value: string, name: string): CalendarDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`${name} must be an ISO date, received "${value}"`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error(`${name} must be a valid ISO date, received "${value}"`);
  }
  return { year, month, day };
}

function formatIsoDate({ year, month, day }: CalendarDate) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function assertIsoDate(value: string, name: string) {
  parseIsoDate(value, name);
}

export function addDaysToIsoDate(value: string, days: number) {
  const date = parseIsoDate(value, "lastCheckedAt");
  for (let remaining = days; remaining > 0; remaining -= 1) {
    date.day += 1;
    if (date.day <= daysInMonth(date.year, date.month)) continue;
    date.day = 1;
    date.month += 1;
    if (date.month <= 12) continue;
    date.month = 1;
    date.year += 1;
  }
  return formatIsoDate(date);
}

export function earlierIsoDate(left: string, right: string) {
  return left < right ? left : right;
}

export function latestIsoDate(values: readonly string[]) {
  return [...values].sort().at(-1)!;
}
