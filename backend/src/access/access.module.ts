import { Module } from "@nestjs/common";
import { AccessService } from "./access.service";
import { AccessController } from "./access.controller";
import { AuthCoreModule } from "../auth/auth-core.module";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [AuthCoreModule, StorageModule],
  providers: [AccessService],
  controllers: [AccessController],
  exports: [AccessService],
})
export class AccessModule {}
