import { Module } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { AuthRepository } from "./auth.repository";

/**
 * Leaf module providing the shared AuthRepository + AuthGuard.
 *
 * Feature modules import this to use AuthGuard in @UseGuards without
 * redeclaring AuthGuard/AuthRepository in their own providers. Kept free of
 * imports so it can be pulled in anywhere without creating cycles (e.g. with
 * FilesModule, which AuthModule itself imports).
 */
@Module({
  providers: [AuthRepository, AuthGuard],
  exports: [AuthRepository, AuthGuard],
})
export class AuthCoreModule {}
