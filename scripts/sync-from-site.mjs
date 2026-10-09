#!/usr/bin/env node
/**
 * 从 Afterword 站点把「主题文件」同步到本主题仓库。
 *
 * 方向：Afterword 是主题的唯一来源，本仓库是派生产物。
 * 排除 src/content/**（个人内容），本仓库自带占位示例内容。
 * package.json 只取依赖与脚本，name/version/description 保留主题自己的。
 *
 * 默认 dry run，加 --apply 才写入。
 */
import { cp, readdir, readFile, writeFile, mkdir, rm, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const THEME = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apply = process.argv.includes("--apply");
const siteIndex = process.argv.indexOf("--site");
const SITE = resolve(siteIndex !== -1 ? process.argv[siteIndex + 1] : "D:\\Code\\Afterword");

const MIRROR_DIRS = [
  "src/components",
  "src/layouts",
  "src/styles",
  "src/lib",
  "src/pages",
  "integrations",
];

const MIRROR_FILES = [
  ".gitignore",
  ".gitattributes",
  ".eslintrc.cjs",
  ".eslintignore",
  "astro.config.mjs",
  "tailwind.config.mjs",
  "tsconfig.json",
  "src/types.ts",
  "src/consts.ts",
  "src/env.d.ts",
  "src/content/config.ts",
  "scripts/generate-og.mjs",
  "public/avatar.svg",
  "public/favicon.svg",
  "public/og.png",
];

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(dir, base = dir) {
  if (!(await exists(dir))) return [];
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(full, base)));
    else out.push(relative(base, full).split("\\").join("/"));
  }
  return out;
}

/** 目录快照：相对路径 -> 内容哈希，用于比对"同名但内容改了"的文件 */
async function snapshot(dir) {
  const map = new Map();
  for (const rel of await listFiles(dir)) {
    const buf = await readFile(join(dir, rel));
    map.set(rel, createHash("sha1").update(buf).digest("hex"));
  }
  return map;
}

const changes = [];

for (const rel of MIRROR_DIRS) {
  const before = await snapshot(join(THEME, rel));
  const after = await snapshot(join(SITE, rel));
  for (const [f, hash] of after) {
    if (!before.has(f)) changes.push("+ " + rel + "/" + f);
    else if (before.get(f) !== hash) changes.push("~ " + rel + "/" + f);
  }
  for (const f of before.keys()) {
    if (!after.has(f)) changes.push("- " + rel + "/" + f);
  }
}

for (const rel of MIRROR_FILES) {
  const from = join(SITE, rel);
  if (!(await exists(from))) {
    changes.push("? " + rel + "  (站点里不存在)");
    continue;
  }
  const to = join(THEME, rel);
  const a = await readFile(from);
  const b = (await exists(to)) ? await readFile(to) : Buffer.alloc(0);
  if (!a.equals(b)) changes.push("~ " + rel);
}

const themePkg = JSON.parse(await readFile(join(THEME, "package.json"), "utf8"));
const sitePkg = JSON.parse(await readFile(join(SITE, "package.json"), "utf8"));
const merged = {
  ...sitePkg,
  name: themePkg.name,
  version: themePkg.version,
  description: themePkg.description,
};
if (JSON.stringify(merged) !== JSON.stringify(themePkg)) {
  changes.push("~ package.json (合并依赖与脚本)");
}

console.log("== " + (apply ? "APPLY" : "DRY RUN") + " ==");
console.log("站点: " + SITE);
console.log("主题: " + THEME);
console.log("");

if (changes.length === 0) {
  console.log("已是最新，无需改动。");
  process.exit(0);
}

for (const c of changes) console.log("  " + c);
console.log("");
console.log("共 " + changes.length + " 处改动。");

if (!apply) {
  console.log("");
  console.log("以上为 dry run，未写入。确认后加 --apply。");
  process.exit(0);
}

for (const rel of MIRROR_DIRS) {
  const from = join(SITE, rel);
  const to = join(THEME, rel);
  await rm(to, { recursive: true, force: true });
  await mkdir(to, { recursive: true });
  await cp(from, to, { recursive: true });
}

for (const rel of MIRROR_FILES) {
  const from = join(SITE, rel);
  if (!(await exists(from))) continue;
  const to = join(THEME, rel);
  await mkdir(dirname(to), { recursive: true });
  await cp(from, to);
}

await writeFile(
  join(THEME, "package.json"),
  JSON.stringify(merged, null, 2) + "\n",
  "utf8"
);

console.log("");
console.log("同步完成。占位内容 (src/content/**) 未被触碰。");
