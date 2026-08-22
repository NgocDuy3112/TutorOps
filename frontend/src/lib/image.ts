const OCR_IMAGE_LIMIT = 900 * 1024;

export async function cropReceiptImage(file: File, area: { x: number; y: number; width: number; height: number }): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("image_crop_failed");
  context.drawImage(bitmap, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("image_crop_failed");
  return new File([blob], "receipt-cropped.jpg", { type: "image/jpeg" });
}

export async function compressReceiptImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("image_compression_failed");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.8, 0.65, 0.5, 0.35]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (blob && quality === 0.35) {
      if (blob.size > OCR_IMAGE_LIMIT) throw new Error("image_too_large");
      return new File([blob], "receipt.jpg", { type: "image/jpeg" });
    }
  }
  throw new Error("image_compression_failed");
}
