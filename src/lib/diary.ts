import { SITE } from "../consts";

export function getDiaryPublicThreshold(now: Date = new Date()): Date {
  const threshold = new Date(now);
  threshold.setFullYear(threshold.getFullYear() - SITE.DIARY_PUBLIC_AFTER_YEARS);
  return threshold;
}

export function isDiaryPublic(date: Date, now: Date = new Date()): boolean {
  return date.valueOf() < getDiaryPublicThreshold(now).valueOf();
}

export type DiaryVisibility = {
  date: Date;
  private?: boolean;
};

/**
 * 日记正文是否可以直接阅读。
 *
 * - `private: true` 的日记永不公开，只能靠密码解锁
 * - 其余日记超过 SITE.DIARY_PUBLIC_AFTER_YEARS 年后自动公开
 */
export function isDiaryUnlocked(
  data: DiaryVisibility,
  now: Date = new Date()
): boolean {
  if (data.private) {
    return false;
  }
  return isDiaryPublic(data.date, now);
}