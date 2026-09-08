import { Module } from "@nestjs/common";
import { SlipsController } from "./slips.controller";
import { SlipsService } from "./slips.service";
import { SlipsRepository } from "./slips.repository";

@Module({
  controllers: [SlipsController],
  providers: [SlipsService, SlipsRepository],
})
export class SlipsModule {}
