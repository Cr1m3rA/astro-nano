import { SITE } from "../consts";

export function getDiaryPublicThreshold(now: Date = new Date()): Date {
  const threshold = new Date(now);
  threshold.setFullYear(threshold.getFullYear() - SITE.DIARY_PUBLIC_AFTER_YEARS);
  return threshold;
}

export function isDiaryPublic(date: Date, now: Date = new Date()): boolean {
  return date.valueOf() < getDiaryPublicThreshold(now).valueOf();
}
