import { Module } from "@nestjs/common";
import { AuthCoreModule } from "../auth/auth-core.module";
import { OcrController } from "./ocr.controller";
import { OcrRepository } from "./ocr.repository";
import { OcrService } from "./ocr.service";

@Module({
  imports: [AuthCoreModule],
  controllers: [OcrController],
  providers: [OcrService, OcrRepository],
})
export class OcrModule {}
