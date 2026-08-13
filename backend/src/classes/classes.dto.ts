import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from "class-validator";

export class CreateClassDto {
  @ApiProperty() @IsString() @MinLength(1) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string;
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultPriceVnd?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class UpdateClassDto extends CreateClassDto {}

export class ClassStudentDto {
  @ApiProperty() @IsUUID() studentId!: string;
}
