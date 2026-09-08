import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthCoreModule } from "./auth-core.module";
import { FilesModule } from "../files/files.module";

@Module({
  imports: [AuthCoreModule, FilesModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
