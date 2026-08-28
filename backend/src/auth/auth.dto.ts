import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CredentialsDto {
  @ApiProperty({ example: "teacher@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 64 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
