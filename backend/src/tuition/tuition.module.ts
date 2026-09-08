import { Module } from "@nestjs/common";
import { AuthCoreModule } from "../auth/auth-core.module";
import { TuitionController } from "./tuition.controller";
import { TuitionService } from "./tuition.service";
import { TuitionRepository } from "./tuition.repository";

@Module({
  imports: [AuthCoreModule],
  controllers: [TuitionController],
  providers: [TuitionService, TuitionRepository],
})
export class TuitionModule {}
