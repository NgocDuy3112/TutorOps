import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiBody, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { FilesService } from "./files.service";

@ApiTags("files")
@Controller("files")
@UseGuards(AuthGuard)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  upload(@Req() request: AuthenticatedRequest, @UploadedFile() file: Express.Multer.File) {
    return this.files.upload(request.user.id, file);
  }
}
