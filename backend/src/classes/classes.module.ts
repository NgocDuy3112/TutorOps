import { Module } from "@nestjs/common";
import { AuthCoreModule } from "../auth/auth-core.module";
import { ClassesController } from "./classes.controller";
import { ClassesRepository } from "./classes.repository";
import { ClassesService } from "./classes.service";

@Module({
  imports: [AuthCoreModule],
  providers: [ClassesService, ClassesRepository],
})
export class ClassesModule {}
