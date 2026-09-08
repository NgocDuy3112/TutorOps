import { Module } from "@nestjs/common";
import { AuthCoreModule } from "../auth/auth-core.module";
import { SlipsController } from "./slips.controller";
import { SlipsService } from "./slips.service";
import { SlipsRepository } from "./slips.repository";

@Module({
  imports: [AuthCoreModule],
  controllers: [SlipsController],
  providers: [SlipsService, SlipsRepository],
})
export class SlipsModule {}
