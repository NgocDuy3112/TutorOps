import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export class CreateStudentDto {
  @ApiProperty() @IsString() @MinLength(1) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentPhone?: string;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultPriceVnd?: number;
  @ApiPropertyOptional({ enum: ["teacher_managed", "self_submit"] })
  @IsOptional()
  @IsEnum(["teacher_managed", "self_submit"])
  submissionMode?: "teacher_managed" | "self_submit";
}

export class UpdateStudentDto extends CreateStudentDto {}
