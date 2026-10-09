import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { parsePhotoExif, type PhotoExif } from "./exif";

const cache = new Map<string, PhotoExif>();
const timeCache = new Map<string, number>();

const sourceFiles = import.meta.glob<string>(
  "/src/content/**/*.{jpg,jpeg,png,webp,avif,tif,tiff}",
  { eager: true, query: "?url", import: "default" }
);

const globPathByUrl = new Map<string, string>();
const globPathByFilename = new Map<string, string>();

for (const [globPath, url] of Object.entries(sourceFiles)) {
  globPathByUrl.set(url, globPath);
  const filename = globPath.split("/").pop();
  if (filename) {
    globPathByFilename.set(filename, globPath);
  }
}

function filenameOf(value: string): string | undefined {
  return value.split("/").pop()?.split("?")[0];
}

function fromDevHref(src: string): string | undefined {
  const match = src.match(/[?&]href=([^&]+)/);
  if (!match) {
    return undefined;
  }
  try {
    const decoded = decodeURIComponent(match[1]).replace(/^\/@fs\//, "");
    const marker = decoded.indexOf("/src/content/");
    if (marker === -1) {
      return undefined;
    }
    const candidate = decoded.slice(marker);
    for (const globPath of globPathByUrl.values()) {
      if (globPath === candidate) {
        return globPath;
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function resolveSourcePath(src: string): string | undefined {
  const exact = globPathByUrl.get(src);
  if (exact) {
    return exact;
  }

  const devHref = fromDevHref(src);
  if (devHref) {
    return devHref;
  }

  const filename = filenameOf(src);
  return filename ? globPathByFilename.get(filename) : undefined;
}

function toDiskPath(globPath: string): string {
  return fileURLToPath(new URL(`../..${globPath}`, import.meta.url));
}

export async function readPhotoExif(src: string): Promise<PhotoExif> {
  const cached = cache.get(src);
  if (cached) {
    return cached;
  }

  const globPath = resolveSourcePath(src);
  if (!globPath) {
    return {};
  }

  let result: PhotoExif;
  try {
    const diskPath = toDiskPath(globPath);
    const metadata = await sharp(diskPath).metadata();
    result = parsePhotoExif({
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      orientation: metadata.orientation,
      exif: metadata.exif,
      size: statSync(diskPath).size,
    });
  } catch {
    result = {};
  }

  cache.set(src, result);
  return result;
}

/**
 * 照片的排序依据：EXIF 拍摄时间优先，缺失时退回文件修改时间。
 * 返回毫秒时间戳；两者都取不到时返回 0，排序会把它排到最前并由文件名兜底。
 */
export async function readPhotoTimestamp(src: string): Promise<number> {
  const cached = timeCache.get(src);
  if (cached !== undefined) {
    return cached;
  }

  let value = 0;
  const globPath = resolveSourcePath(src);

  if (globPath) {
    const exif = await readPhotoExif(src);
    if (exif.takenAt) {
      const parsed = Date.parse(exif.takenAt);
      if (!Number.isNaN(parsed)) {
        value = parsed;
      }
    }

    if (value === 0) {
      try {
        value = statSync(toDiskPath(globPath)).mtimeMs;
      } catch {
        value = 0;
      }
    }
  }

  timeCache.set(src, value);
  return value;
}
