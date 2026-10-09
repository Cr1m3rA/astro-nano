import type { ImageMetadata } from "astro";
import { readPhotoTimestamp } from "./photo";

export type GalleryPhoto = {
  src: ImageMetadata;
  filename: string;
  orientation: "landscape" | "portrait" | "square";
};

const IMAGE_PATTERN = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;

const modules = import.meta.glob<{ default: ImageMetadata }>(
  "/src/content/photography/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
  { eager: true }
);

function orientationOf(width: number, height: number): GalleryPhoto["orientation"] {
  const ratio = width / height;
  if (ratio > 1.05) {
    return "landscape";
  }
  if (ratio < 0.95) {
    return "portrait";
  }
  return "square";
}

function slugOf(path: string): string | undefined {
  return path.match(/\/src\/content\/photography\/(.+)\/[^/]+$/)?.[1];
}

const bySlug = new Map<string, GalleryPhoto[]>();

for (const [path, module] of Object.entries(modules)) {
  if (!IMAGE_PATTERN.test(path)) {
    continue;
  }
  const slug = slugOf(path);
  if (!slug) {
    continue;
  }
  const image = module.default;
  const bucket = bySlug.get(slug) ?? [];
  bucket.push({
    src: image,
    filename: path.split("/").pop() ?? path,
    orientation: orientationOf(image.width, image.height),
  });
  bySlug.set(slug, bucket);
}

/**
 * 影集内的照片按拍摄时间从早到晚排序。
 * 依据 EXIF 拍摄时间，缺失时退回文件修改时间；两者相同时用文件名兜底
 * （数字感知，所以 01-、02- 这类前缀会按预期顺序排）。
 */
export async function getPhotoGallery(slug: string): Promise<GalleryPhoto[]> {
  const photos = bySlug.get(slug) ?? [];

  const timed = await Promise.all(
    photos.map(async (photo) => ({
      photo,
      at: await readPhotoTimestamp(photo.src.src),
    }))
  );

  timed.sort((a, b) => {
    if (a.at !== b.at) {
      return a.at - b.at;
    }
    return a.photo.filename.localeCompare(b.photo.filename, "en", { numeric: true });
  });

  return timed.map((entry) => entry.photo);
}
