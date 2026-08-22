import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthRepository } from "../auth/auth.repository";
import { OcrController } from "./ocr.controller";
import { OcrRepository } from "./ocr.repository";
import { OcrService } from "./ocr.service";

@Module({
  controllers: [OcrController],
  providers: [OcrService, OcrRepository, AuthGuard, AuthRepository],
})
export class OcrModule {}
