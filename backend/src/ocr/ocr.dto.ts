import { ApiProperty } from "@nestjs/swagger";

export class OcrReceiptResponseDto {
  @ApiProperty()
  text!: string;

  @ApiProperty()
  processingTimeMs!: number;
}
