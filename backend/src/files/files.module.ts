import { Module } from "@nestjs/common";
import { AuthCoreModule } from "../auth/auth-core.module";
import { FilesController } from "./files.controller";
import { FilesRepository } from "./files.repository";
import { FilesService } from "./files.service";

@Module({
  imports: [AuthCoreModule],
  controllers: [FilesController],
  providers: [FilesService, FilesRepository],
  exports: [FilesService],
})
export class FilesModule {}
