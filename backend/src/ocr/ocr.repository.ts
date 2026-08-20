import { Injectable, ServiceUnavailableException, UnprocessableEntityException } from "@nestjs/common";
import { ocrSpace } from "ocr-space-api-wrapper";

export type OcrResult = {
  text: string;
  processingTimeMs: number;
};

@Injectable()
export class OcrRepository {
  async parseImage(file: Express.Multer.File): Promise<OcrResult> {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException("ocr_not_configured");

    const startedAt = Date.now();
    const input = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const result = await ocrSpace(input, {
      apiKey,
      // OCR.space API accepts `vnm`; wrapper typings only list its newer `vie` alias.
      language: "vnm" as import("ocr-space-api-wrapper").OcrSpaceOptions["language"],
      OCREngine: "2",
      isTable: true,
      detectOrientation: true,
    });

    if (result.IsErroredOnProcessing || result.OCRExitCode === 3 || result.OCRExitCode === 4)
      throw new ServiceUnavailableException("ocr_failed");

    const text = result.ParsedResults?.map((item) => item.ParsedText ?? "").join("\n").trim() ?? "";
    if (!text) throw new UnprocessableEntityException("ocr_empty");

    return { text, processingTimeMs: Date.now() - startedAt };
  }
}
