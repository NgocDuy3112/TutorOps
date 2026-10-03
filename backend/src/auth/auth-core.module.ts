import { Module } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { AuthRepository } from "./auth.repository";

@Module({
  providers: [AuthRepository, AuthGuard],
  exports: [AuthRepository, AuthGuard],
})
export class AuthCoreModule {}
