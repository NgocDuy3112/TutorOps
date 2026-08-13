import { Module } from "@nestjs/common";
import { AccessService } from "./access.service";
import { AccessController } from "./access.controller";
import { AuthGuard } from "../auth/auth.guard";
import { AuthRepository } from "../auth/auth.repository";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule],
  providers: [AccessService, AuthGuard, AuthRepository],
  controllers: [AccessController],
  exports: [AccessService],
})
export class AccessModule {}
