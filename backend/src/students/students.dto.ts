import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

export class CreateStudentDto {
  @ApiProperty() @IsString() @MinLength(1) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^0\d{9}$/, { message: "Số điện thoại phải có 10 chữ số, bắt đầu bằng 0" }) parentPhone?: string;
}

export class UpdateStudentDto extends CreateStudentDto {}
