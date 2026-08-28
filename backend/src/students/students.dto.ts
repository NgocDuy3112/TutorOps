import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from "class-validator";

export class CreateStudentDto {
  @ApiProperty() @IsString() @MinLength(1) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^0\d{9}$/, { message: "Số điện thoại phải có 10 chữ số, bắt đầu bằng 0" }) parentPhone?: string;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000_000)
  defaultPriceVnd?: number;
  @ApiPropertyOptional({ enum: ["teacher_managed", "self_submit"] })
  @IsOptional()
  @IsEnum(["teacher_managed", "self_submit"])
  submissionMode?: "teacher_managed" | "self_submit";
}

export class UpdateStudentDto extends CreateStudentDto {}
