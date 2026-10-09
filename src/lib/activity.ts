export type ActivityRecord = {
  date: Date;
  words: number;
};

export type ActivityCell = {
  key: string;
  tooltip: string;
  words: number;
  count: number;
  level: number;
  future: boolean;
};

export type ActivityDayGrid = {
  weeks: ActivityCell[][];
  monthLabels: { index: number; label: string }[];
};

export type ActivityMonthRow = {
  year: number;
  cells: ActivityCell[];
};

export type ActivitySummary = {
  entries: number;
  words: number;
  activeDays: number;
};

export const LEVEL_CLASSES = [
  "bg-black/[0.07] dark:bg-white/10",
  "bg-emerald-200 dark:bg-emerald-900",
  "bg-emerald-400 dark:bg-emerald-700",
  "bg-emerald-600 dark:bg-emerald-500",
  "bg-emerald-800 dark:bg-emerald-300",
] as const;

const LEVEL_THRESHOLDS = [1, 300, 1000, 3000];

const WEEK_START_OFFSET = 6;

export function activityLevel(words: number): number {
  let level = 0;
  for (let index = 0; index < LEVEL_THRESHOLDS.length; index += 1) {
    if (words >= LEVEL_THRESHOLDS[index]) {
      level = index + 1;
    }
  }
  return level;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function dayKey(date: Date): string {
  const day = startOfDay(date);
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

function describe(label: string, words: number, count: number): string {
  if (count === 0) {
    return `${label} · 无更新`;
  }
  return `${label} · ${words.toLocaleString("zh-CN")} 字 · ${count} 篇`;

}

type Bucket = { words: number; count: number };

function aggregate(
  records: ActivityRecord[],
  keyOf: (date: Date) => string
): Map<string, Bucket> {
  const buckets = new Map<string, Bucket>();
  for (const record of records) {
    const key = keyOf(record.date);
    const bucket = buckets.get(key) ?? { words: 0, count: 0 };
    bucket.words += record.words;
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  return buckets;
}

function makeCell(
  key: string,
  label: string,
  bucket: Bucket | undefined,
  future: boolean
): ActivityCell {
  const words = bucket?.words ?? 0;
  const count = bucket?.count ?? 0;
  return {
    key,
    tooltip: describe(label, words, count),
    words,
    count,
    level: activityLevel(words),
    future,
  };
}

function firstYear(records: ActivityRecord[], fallback: number): number {
  if (records.length === 0) {
    return fallback;
  }
  return records.reduce(
    (min, record) => Math.min(min, record.date.getFullYear()),
    fallback
  );
}

export function buildDayGrid(
  records: ActivityRecord[],
  totalWeeks = 53,
  today = new Date()
): ActivityDayGrid {
  const buckets = aggregate(records, dayKey);
  const current = startOfDay(today);
  const weekday = (current.getDay() + WEEK_START_OFFSET) % 7;
  const end = addDays(current, WEEK_START_OFFSET - weekday);
  const start = addDays(end, -(totalWeeks * 7 - 1));

  const weeks: ActivityCell[][] = [];
  const monthLabels: { index: number; label: string }[] = [];
  let lastLabelledWeek = -3;

  for (let week = 0; week < totalWeeks; week += 1) {
    const cells: ActivityCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = addDays(start, week * 7 + day);
      cells.push(
        makeCell(
          dayKey(date),
          `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`,
          buckets.get(dayKey(date)),
          date.valueOf() > current.valueOf()
        )
      );
    }
    weeks.push(cells);

    const monday = addDays(start, week * 7);
    const previousMonday = addDays(start, week * 7 - 7);
    const monthChanged = week === 0 || monday.getMonth() !== previousMonday.getMonth();
    if (monthChanged && week - lastLabelledWeek >= 3 && week < totalWeeks - 1) {
      monthLabels.push({ index: week, label: `${monday.getMonth() + 1} 月` });
      lastLabelledWeek = week;
    }
  }

  return { weeks, monthLabels };
}

export function buildMonthRows(
  records: ActivityRecord[],
  today = new Date()
): ActivityMonthRow[] {
  const buckets = aggregate(
    records,
    (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
  );
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const rows: ActivityMonthRow[] = [];

  for (let year = firstYear(records, currentYear); year <= currentYear; year += 1) {
    const cells: ActivityCell[] = [];
    for (let month = 0; month < 12; month += 1) {
      const key = `${year}-${pad(month + 1)}`;
      cells.push(
        makeCell(
          key,
          `${year} 年 ${month + 1} 月`,
          buckets.get(key),
          year === currentYear && month > currentMonth
        )
      );
    }
    rows.push({ year, cells });
  }

  return rows;
}

export function buildYearCells(
  records: ActivityRecord[],
  today = new Date()
): ActivityCell[] {
  const buckets = aggregate(records, (date) => `${date.getFullYear()}`);
  const currentYear = today.getFullYear();
  const cells: ActivityCell[] = [];

  for (let year = firstYear(records, currentYear); year <= currentYear; year += 1) {
    const key = `${year}`;
    cells.push(makeCell(key, `${year} 年`, buckets.get(key), false));
  }

  return cells;
}

export function summarize(records: ActivityRecord[]): ActivitySummary {
  const days = new Set<string>();
  let words = 0;
  for (const record of records) {
    days.add(dayKey(record.date));
    words += record.words;
  }
  return { entries: records.length, words, activeDays: days.size };
}
