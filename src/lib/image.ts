import imageCompression, { type Options } from "browser-image-compression";

const MIN_PROCESS_BYTES = 40 * 1024; // Skip compression for already tiny files

const BASE_OPTIONS: Options = {
  maxSizeMB: 1.2,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  initialQuality: 0.85,
};

export type CompressImageOptions = Partial<Options> & {
  skipIfSmallerThanBytes?: number;
};

const isImageFile = (file: File) => file.type?.startsWith("image/");

export async function compressImageFile(
  file: File,
  options?: CompressImageOptions,
): Promise<File> {
  if (!(file instanceof File) || !isImageFile(file)) return file;

  const minBytes = options?.skipIfSmallerThanBytes ?? MIN_PROCESS_BYTES;
  if (file.size <= minBytes) return file;

  const mergedOptions: Options = { ...BASE_OPTIONS, ...options };

  try {
    const compressed = await imageCompression(file, mergedOptions);
    // Keep the smaller file to avoid growing uploads when compression is ineffective.
    if (compressed.size >= file.size * 0.98) return file;
    return compressed;
  } catch (error) {
    console.warn("Image compression failed; falling back to original file", error);
    return file;
  }
}
