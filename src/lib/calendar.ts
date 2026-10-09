import ZodiacCapricorn from "@lucide/astro/icons/zodiac-capricorn";
import ZodiacAquarius from "@lucide/astro/icons/zodiac-aquarius";
import ZodiacPisces from "@lucide/astro/icons/zodiac-pisces";
import ZodiacAries from "@lucide/astro/icons/zodiac-aries";
import ZodiacTaurus from "@lucide/astro/icons/zodiac-taurus";
import ZodiacGemini from "@lucide/astro/icons/zodiac-gemini";
import ZodiacCancer from "@lucide/astro/icons/zodiac-cancer";
import ZodiacLeo from "@lucide/astro/icons/zodiac-leo";
import ZodiacVirgo from "@lucide/astro/icons/zodiac-virgo";
import ZodiacLibra from "@lucide/astro/icons/zodiac-libra";
import ZodiacScorpio from "@lucide/astro/icons/zodiac-scorpio";
import ZodiacSagittarius from "@lucide/astro/icons/zodiac-sagittarius";
import Snowflake from "@lucide/astro/icons/snowflake";
import CloudSnow from "@lucide/astro/icons/cloud-snow";
import Sprout from "@lucide/astro/icons/sprout";
import Flower from "@lucide/astro/icons/flower";
import Flower2 from "@lucide/astro/icons/flower-2";
import Sun from "@lucide/astro/icons/sun";
import SunMedium from "@lucide/astro/icons/sun-medium";
import Flame from "@lucide/astro/icons/flame";
import Leaf from "@lucide/astro/icons/leaf";
import Apple from "@lucide/astro/icons/apple";
import Wind from "@lucide/astro/icons/wind";
import CloudMoon from "@lucide/astro/icons/cloud-moon";

const YEAR_ICONS = [
  ZodiacCapricorn,
  ZodiacAquarius,
  ZodiacPisces,
  ZodiacAries,
  ZodiacTaurus,
  ZodiacGemini,
  ZodiacCancer,
  ZodiacLeo,
  ZodiacVirgo,
  ZodiacLibra,
  ZodiacScorpio,
  ZodiacSagittarius,
] as const;

const YEAR_ICON_LABELS = [
  "摩羯座",
  "水瓶座",
  "双鱼座",
  "白羊座",
  "金牛座",
  "双子座",
  "巨蟹座",
  "狮子座",
  "处女座",
  "天秤座",
  "天蝎座",
  "射手座",
] as const;

const MONTH_ICONS = [
  Snowflake,
  CloudSnow,
  Sprout,
  Flower,
  Flower2,
  Sun,
  SunMedium,
  Flame,
  Leaf,
  Apple,
  Wind,
  CloudMoon,
] as const;

export type CalendarIcon = (typeof YEAR_ICONS)[number];

export function getYearIcon(year: number): CalendarIcon {
  return YEAR_ICONS[((year % 12) + 12) % 12];
}

export function getYearIconLabel(year: number): string {
  return YEAR_ICON_LABELS[((year % 12) + 12) % 12];
}

export function getMonthIcon(month: number): CalendarIcon {
  return MONTH_ICONS[((month - 1) % 12 + 12) % 12];
}
