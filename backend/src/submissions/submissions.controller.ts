import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { FilesService } from "../files/files.service";
import { AccessService } from "../access/access.service";
import { SubmissionsService } from "./submissions.service";

@Controller("public/submissions")
export class SubmissionsController {
  constructor(
    private readonly submissions: SubmissionsService,
    private readonly files: FilesService,
    private readonly access: AccessService,
  ) {}
  @Post()
  @UseInterceptors(
    FilesInterceptor("files", 10, { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  async create(
    @Query("token") token: string,
    @Query("assignmentId") assignmentId: string,
    @UploadedFiles() uploadedFiles: Express.Multer.File[],
  ) {
    if (!token || !assignmentId || !uploadedFiles?.length)
      throw new BadRequestException("files_required");
    await this.access.authenticate(token, "student");
    const files = await Promise.all(
      uploadedFiles.map((file) => this.files.upload(null, file, "submissions")),
    );
    return this.submissions.create(token, assignmentId, {
      fileIds: files.map((file) => file.id),
    });
  }
}
