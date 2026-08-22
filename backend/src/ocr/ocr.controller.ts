import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { OcrService } from "./ocr.service";

@ApiTags("ocr")
@Controller("ocr")
@UseGuards(AuthGuard)
export class OcrController {
  constructor(private readonly ocr: OcrService) {}

  @Post("receipt")
  @ApiOperation({ summary: "Read receipt image with OCR" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
      required: ["file"],
    },
  })
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }))
  parseReceipt(@UploadedFile() file: Express.Multer.File) {
    return this.ocr.parseReceipt(file);
  }
}
