import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";
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

/**
 * 日记的 `private: true` 写在各自的 frontmatter 里，而 sitemap 的 filter 只拿得到
 * URL，所以这里在构建前扫一遍源文件，收集「永不公开」的 slug。
 */
function readPrivateDiarySlugs() {
  const slugs = new Set();
  const root = fileURLToPath(new URL("./src/content/diary/", import.meta.url));
  let names;
  try {
    names = readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return slugs;
  }
  for (const name of names) {
    for (const file of ["index.md", "index.mdx"]) {
      try {
        const raw = readFileSync(join(root, name, file), "utf8");
        const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (frontmatter && /^\s*private\s*:\s*true\s*$/m.test(frontmatter[1])) {
          slugs.add(name);
        }
        break;
      } catch {
        // 换下一个文件名再试
      }
    }
  }
  return slugs;
}

const PRIVATE_DIARY_SLUGS = readPrivateDiarySlugs();

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
        const match = page.match(/\/diary\/([^/]+)\/?$/);
        if (!match) {
          return true;
        }
        const slug = match[1];
        // 标记为 private 的日记永不公开，任何时候都不进 sitemap
        if (PRIVATE_DIARY_SLUGS.has(slug)) {
          return false;
        }
        // diary 的 slug 以日期开头，允许带后缀（同日多篇时用 -xxx 区分）
        const date = slug.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!date) {
          return true;
        }
        const [, year, month, day] = date;
        return isDiaryPublic(new Date(`${year}-${month}-${day}T00:00:00`));
      },
    }),
    tailwind(),
    diaryVault({ password: readDiaryPassword() }),
  ],
});
