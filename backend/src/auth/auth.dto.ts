import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class GoogleOneTapDto {
  @ApiProperty({ description: "Google ID token (JWT) from One Tap / GIS" })
  @IsString()
  @MinLength(1)
  credential!: string;
}

export class CredentialsDto {
  @ApiProperty({ example: "teacher@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 64 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;
}
