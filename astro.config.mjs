import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import remarkBreaks from "remark-breaks";
import diaryVault from "./integrations/diary-vault";
import { isDiaryPublic } from "./src/lib/diary";

function readDiaryPassword() {
  if (process.env.DIARY_PASSWORD) {
    return process.env.DIARY_PASSWORD;
  }
  for (const file of [".env.local", ".env"]) {
    try {
      const parsed = parseEnv(readFileSync(new URL(file, import.meta.url), "utf8"));
      if (parsed.DIARY_PASSWORD) {
        return parsed.DIARY_PASSWORD;
      }
    } catch {
      // file may not exist, try the next one
    }
  }
  return "";
}

export default defineConfig({
  site: "https://afterwordx.pages.dev",
  markdown: {
    // 日记里常有「一行一句」的写法。Markdown 默认把单换行渲染成空格，
    // 会把整段挤成一行；开启后单换行还原成换行，保留作者的分行节奏。
    remarkPlugins: [remarkBreaks],
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        // diary 的 slug 以日期开头，允许带后缀（同日多篇时用 -xxx 区分）
        const match = page.match(/\/diary\/(\d{4})-(\d{2})-(\d{2})(?:-[^/]*)?\/?$/);
        if (!match) {
          return true;
        }
        const [, year, month, day] = match;
        return isDiaryPublic(new Date(`${year}-${month}-${day}T00:00:00`));
      },
    }),
    tailwind(),
    diaryVault({ password: readDiaryPassword() }),
  ],
});
