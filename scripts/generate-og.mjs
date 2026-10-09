import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;
const BACKGROUND = "#1c1917";
const FOREGROUND = "#fafaf9";
const MUTED = "#a8a29e";

const FONT_PATH =
  "node_modules/@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff2";

export async function renderOgImage({ title, subtitle, output }) {
  const font = await readFile(FONT_PATH);
  const fontBase64 = font.toString("base64");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <style>
      @font-face {
        font-family: 'Great Vibes';
        src: url(data:font/woff2;base64,${fontBase64}) format('woff2');
      }
      .display { font-family: 'Great Vibes', cursive; }
      .sub { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    </style>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BACKGROUND}" />
  <text class="display" x="${WIDTH / 2}" y="330" font-size="150" fill="${FOREGROUND}" text-anchor="middle">${title}</text>
  <text class="sub" x="${WIDTH / 2}" y="410" font-size="28" fill="${MUTED}" text-anchor="middle" letter-spacing="6">${subtitle}</text>
  <rect x="${WIDTH / 2 - 60}" y="455" width="120" height="2" fill="${MUTED}" />
</svg>`;

  const buffer = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(output, buffer);
  return buffer.length;
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/generate-og.mjs");

if (isDirectRun) {
  const size = await renderOgImage({
    title: "Afterword",
    subtitle: "BLOG / DIARY / PHOTOGRAPHY",
    output: "public/og.png",
  });
  console.log(`public/og.png 生成完成 (${size} bytes)`);
}
