import { Injectable, ServiceUnavailableException, UnprocessableEntityException } from "@nestjs/common";
import { AppLogger } from "../common/app-logger";
import { ocrSpace } from "ocr-space-api-wrapper";
import type { OcrSpaceResponse } from "ocr-space-api-wrapper";

export type OcrResult = {
  text: string;
  processingTimeMs: number;
};

@Injectable()
export class OcrRepository {
  constructor(private readonly logger: AppLogger) {}

  async parseImage(file: Express.Multer.File): Promise<OcrResult> {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    this.logger.log("ocr_request_started", { mime: file.mimetype, size: file.size }, "OcrRepository");
    if (!apiKey) throw new ServiceUnavailableException("ocr_not_configured");

    const startedAt = Date.now();
    const input = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    let result: OcrSpaceResponse;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      result = await ocrSpace(input, {
        apiKey,
        language: "vnm" as import("ocr-space-api-wrapper").OcrSpaceOptions["language"],
        OCREngine: "3",
        isTable: true,
        detectOrientation: true,
        signal: controller.signal,
      });
    } catch (error) {
      const timedOut = controller.signal.aborted;
      this.logger.error("ocr_provider_request_failed", { error: timedOut ? "timeout" : error instanceof Error ? error.message : "unknown_error" }, undefined, "OcrRepository");
      throw new ServiceUnavailableException(timedOut ? "ocr_timeout" : "ocr_unavailable");
    } finally {
      clearTimeout(timeout);
    }

    this.logger.log("ocr_provider_completed", { exitCode: result.OCRExitCode, processingMs: result.ProcessingTimeInMilliseconds ?? null, parsedResults: result.ParsedResults?.length ?? 0 }, "OcrRepository");
    if (result.IsErroredOnProcessing || result.OCRExitCode === 3 || result.OCRExitCode === 4)
      throw new ServiceUnavailableException("ocr_failed");

    const text = result.ParsedResults?.map((item) => item.ParsedText ?? "").join("\n").trim() ?? "";
    if (!text) throw new UnprocessableEntityException("ocr_empty");

    return { text, processingTimeMs: Date.now() - startedAt };
  }
}
