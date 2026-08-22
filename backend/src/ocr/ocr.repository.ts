import { Injectable, ServiceUnavailableException, UnprocessableEntityException } from "@nestjs/common";
import { AppLogger } from "../common/app-logger";
import { parseReceiptText } from "./receipt-parser";

type OcrSpaceResponse = {
  IsErroredOnProcessing?: boolean;
  OCRExitCode?: number;
  ProcessingTimeInMilliseconds?: string | number;
  ParsedResults?: { ParsedText?: string }[];
};

export type OcrResult = ReturnType<typeof parseReceiptText> & {
  text: string;
  processingTimeMs: number;
};

@Injectable()
export class OcrRepository {
  constructor(private readonly logger: AppLogger) {}

  async parseImage(file: Express.Multer.File): Promise<OcrResult> {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException("ocr_not_configured");

    const startedAt = Date.now();
    this.logger.log("ocr_request_started", { mime: file.mimetype, size: file.size }, "OcrRepository");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
    form.append("language", "vnm");
    form.append("OCREngine", "2");
    form.append("isTable", "true");
    form.append("detectOrientation", "true");

    let result: OcrSpaceResponse;
    try {
      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: { apikey: apiKey },
        body: form,
        signal: controller.signal,
      });
      result = await response.json() as OcrSpaceResponse;
      if (!response.ok) {
        this.logger.error("ocr_provider_http_error", { statusCode: response.status }, undefined, "OcrRepository");
        throw new ServiceUnavailableException("ocr_unavailable");
      }
    } catch (error) {
      const timedOut = controller.signal.aborted;
      if (error instanceof ServiceUnavailableException) throw error;
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

    return {
      ...parseReceiptText(text),
      text,
      processingTimeMs: Date.now() - startedAt,
    };
  }
}
