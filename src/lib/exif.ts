import exifReader from "exif-reader";

export type PhotoExif = {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  takenAt?: string;
  dimensions?: string;
  orientation?: "landscape" | "portrait" | "square";
  size?: string;
};

type ExifLike = {
  Image?: Record<string, unknown>;
  Photo?: Record<string, unknown>;
  Thumbnail?: Record<string, unknown>;
};

const TAG_LENS_MODEL = "42036";

export type SharpMetadata = {
  width?: number;
  height?: number;
  format?: string;
  orientation?: number;
  exif?: Buffer;
  size?: number;
};

function asString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? `${value[0]}/${value[1]}` : undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "number") {
    return `${value}`;
  }
  if (typeof value === "string") {
    return value.trim() || undefined;
  }
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "number" && typeof value[1] === "number" && value[1] !== 0) {
    return value[0] / value[1];
  }
  return undefined;
}

/**
 * 有些机型（如 DJI）把镜头型号写成裸的「6.7 mm f/1.7」，
 * 与随后显示的焦距、光圈完全重复，这种情况视为没有镜头信息。
 */
function normalizeLens(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return /^\d+(?:\.\d+)?\s*mm\s*f\/?\d/i.test(value.trim()) ? undefined : value;
}

function formatShutter(seconds: number): string {
  if (seconds >= 1) {
    return `${Number(seconds.toFixed(1))}s`;
  }
  return `1/${Math.round(1 / seconds)}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function describeOrientation(
  width?: number,
  height?: number
): PhotoExif["orientation"] {
  if (!width || !height) {
    return undefined;
  }
  const ratio = width / height;
  if (ratio > 1.05) {
    return "landscape";
  }
  if (ratio < 0.95) {
    return "portrait";
  }
  return "square";
}

export function parsePhotoExif(metadata: SharpMetadata): PhotoExif {
  const result: PhotoExif = {};

  let width = metadata.width;
  let height = metadata.height;

  if (
    metadata.orientation &&
    metadata.orientation >= 5 &&
    metadata.orientation <= 8 &&
    width &&
    height
  ) {
    [width, height] = [height, width];
  }

  if (width && height) {
    result.dimensions = `${width} × ${height}`;
    result.orientation = describeOrientation(width, height);
  }

  if (metadata.size) {
    result.size = formatBytes(metadata.size);
  }

  if (metadata.exif) {
    let tags: ExifLike | undefined;
    try {
      tags = exifReader(metadata.exif) as ExifLike;
    } catch {
      tags = undefined;
    }

    if (tags) {
      const image = tags.Image ?? {};
      const photo = tags.Photo ?? {};

      const camera =
        [asString(image.Make), asString(image.Model)]
          .filter(Boolean)
          .join(" ") || undefined;

      result.camera = camera;
      result.lens =
        asString(photo.LensModel) ??
        asString(photo.Lens) ??
        asString(photo[TAG_LENS_MODEL]) ??
        asString(image[TAG_LENS_MODEL]) ??
        asString(image.LensModel);
      result.lens = normalizeLens(result.lens);

      const focal = asNumber(photo.FocalLength);
      if (focal) {
        result.focalLength = `${Math.round(focal)}mm`;
      }

      const aperture = asNumber(photo.FNumber);
      if (aperture) {
        result.aperture = `ƒ/${aperture.toFixed(1)}`;
      }

      const exposure = asNumber(photo.ExposureTime);
      if (exposure) {
        result.shutter = formatShutter(exposure);
      }

      const iso = asNumber(photo.ISOSpeedRatings) ?? asNumber(photo.PhotographicSensitivity);
      if (iso) {
        result.iso = `ISO ${Math.round(iso)}`;
      }

      const taken = photo.DateTimeOriginal ?? image.DateTime;
      if (taken instanceof Date) {
        result.takenAt = taken.toISOString();
      }
    }
  }

  return result;
}

export function hasExifDetails(exif: PhotoExif): boolean {
  return Object.values(exif).some((value) => Boolean(value));
}
