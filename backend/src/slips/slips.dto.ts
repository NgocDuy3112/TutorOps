import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class UpsertMonthlyNoteDto {
  @ApiProperty({ example: "2026-09" })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "Tháng phải có dạng YYYY-MM" })
  month!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
