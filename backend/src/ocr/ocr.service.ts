import { BadRequestException, Injectable } from "@nestjs/common";
import { OcrRepository } from "./ocr.repository";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/heic"]);
const maxFileSize = 10 * 1024 * 1024;

@Injectable()
export class OcrService {
  constructor(private readonly repository: OcrRepository) {}

  parseReceipt(file: Express.Multer.File) {
    if (!file || !allowedMimeTypes.has(file.mimetype) || file.size <= 0 || file.size > maxFileSize)
      throw new BadRequestException("invalid_receipt_image");
    return this.repository.parseImage(file);
  }
}
