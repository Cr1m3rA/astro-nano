import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

export function formatFullDate(date: Date) {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

export function formatDateRange(start: Date, end?: Date): string {
  if (!end || end.valueOf() === start.valueOf()) {
    return formatFullDate(start);
  }

  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1;
  const endYear = end.getFullYear();
  const endMonth = end.getMonth() + 1;
  const startLabel = `${startYear} 年 ${startMonth} 月 ${start.getDate()} 日`;

  if (startYear === endYear && startMonth === endMonth) {
    return `${startLabel} – ${end.getDate()} 日`;
  }
  if (startYear === endYear) {
    return `${startLabel} – ${endMonth} 月 ${end.getDate()} 日`;
  }
  return `${startLabel} – ${endYear} 年 ${endMonth} 月 ${end.getDate()} 日`;
}

export function excerpt(source?: string, maxLength = 100): string {
  if (!source) {
    return "";
  }

  const text = String(source)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/^[ \t]*(?:import|export)\b.*$/gm, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}([-*_])(\s*\1){2,}\s*$/gm, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}\d+\.\s+/gm, "")
    .replace(/[*_~]{1,3}/g, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) {
    return text;
  }

  const clipped = text.slice(0, maxLength);
  const sentenceEnd = Math.max(
    clipped.lastIndexOf("。"),
    clipped.lastIndexOf("！"),
    clipped.lastIndexOf("？"),
    clipped.lastIndexOf(".")
  );

  if (sentenceEnd > maxLength * 0.5) {
    return clipped.slice(0, sentenceEnd + 1);
  }

  const softBreak = Math.max(
    clipped.lastIndexOf("，"),
    clipped.lastIndexOf("；"),
    clipped.lastIndexOf(" "),
    clipped.lastIndexOf("、")
  );
  const kept = softBreak > maxLength * 0.6 ? clipped.slice(0, softBreak) : clipped;

  return `${kept.trim()}…`;
}

const CJK_PATTERN =
  /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g;

/** 中文按字数、拉丁按词数统计，用于阅读时长和活动热力图。 */
export function countWords(source?: string): number {
  if (!source) {
    return 0;
  }

  const text = source.replace(/<[^>]+>/g, " ");
  const cjk = text.match(CJK_PATTERN);
  const latin = text
    .replace(CJK_PATTERN, " ")
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token));

  return (cjk?.length ?? 0) + latin.length;
}

export function readingTime(html: string): string {
  const minutes = Math.max(1, Math.round(countWords(html) / 300));
  return `${minutes} 分钟`;
}

export type YearGroup<T> = {
  year: number;
  entries: T[];
};

export type MonthGroup<T> = {
  month: number;
  entries: T[];
};

export type YearMonthGroup<T> = {
  year: number;
  months: MonthGroup<T>[];
};

function sortDesc<T>(entries: T[], getDate: (entry: T) => Date): T[] {
  return [...entries].sort((a, b) => getDate(b).valueOf() - getDate(a).valueOf());
}

export type SortDirection = "asc" | "desc";

function sortBy<T>(
  entries: T[],
  getDate: (entry: T) => Date,
  direction: SortDirection
): T[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...entries].sort(
    (a, b) => sign * (getDate(a).valueOf() - getDate(b).valueOf())
  );
}

export function groupByYear<T>(
  entries: T[],
  getDate: (entry: T) => Date,
  direction: SortDirection = "desc"
): YearGroup<T>[] {
  const groups = new Map<number, T[]>();

  for (const entry of sortBy(entries, getDate, direction)) {
    const year = getDate(entry).getFullYear();
    const bucket = groups.get(year);
    if (bucket) {
      bucket.push(entry);
    } else {
      groups.set(year, [entry]);
    }
  }

  const sign = direction === "asc" ? 1 : -1;
  return [...groups.entries()]
    .sort((a, b) => sign * (a[0] - b[0]))
    .map(([year, items]) => ({ year, entries: items }));
}

export function groupByYearMonth<T>(entries: T[], getDate: (entry: T) => Date): YearMonthGroup<T>[] {
  const groups = new Map<number, Map<number, T[]>>();

  for (const entry of sortDesc(entries, getDate)) {
    const date = getDate(entry);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    let months = groups.get(year);
    if (!months) {
      months = new Map<number, T[]>();
      groups.set(year, months);
    }

    const bucket = months.get(month);
    if (bucket) {
      bucket.push(entry);
    } else {
      months.set(month, [entry]);
    }
  }

  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([month, items]) => ({ month, entries: items })),
    }));
}
