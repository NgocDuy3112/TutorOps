import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AssignmentsService } from "./assignments.service";
import {
  CreateAssignmentDto,
  ReviewDropboxSubmissionDto,
  UpdateAssignmentDto,
} from "./assignments.dto";
import { ParseUUIDPipe } from "@nestjs/common";

@Controller("assignments")
@UseGuards(AuthGuard)
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.assignments.list(request.user.id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateAssignmentDto,
  ) {
    return this.assignments.create(request.user.id, body);
  }

  @Patch(":id")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() body: UpdateAssignmentDto,
  ) {
    return this.assignments.update(request.user.id, id, body);
  }

  @Get(":id/dropbox-submissions")
  dropboxSubmissions(
    @Req() request: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.assignments.dropboxSubmissions(request.user.id, id);
  }

  @Patch(":id/dropbox-submissions/:submissionId/review")
  reviewDropboxSubmission(
    @Req() request: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("submissionId", new ParseUUIDPipe()) submissionId: string,
    @Body() body: ReviewDropboxSubmissionDto,
  ) {
    return this.assignments.reviewDropboxSubmission(
      request.user.id,
      id,
      submissionId,
      body,
    );
  }

  @Patch(":id/dropbox-submissions/:submissionId/:status")
  markDropboxSubmission(
    @Req() request: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("submissionId", new ParseUUIDPipe()) submissionId: string,
    @Param("status") status: "viewed" | "downloaded",
  ) {
    if (status !== "viewed" && status !== "downloaded")
      throw new Error("invalid_status");
    return this.assignments.markDropboxSubmission(
      request.user.id,
      id,
      submissionId,
      status,
    );
  }

  @Get(":id/dropbox-files/:fileId/url")
  dropboxFileUrl(
    @Req() request: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("fileId", new ParseUUIDPipe()) fileId: string,
  ) {
    return this.assignments.dropboxFileUrl(request.user.id, id, fileId);
  }

  @Delete(":id")
  remove(
    @Req() request: AuthenticatedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.assignments.remove(request.user.id, id);
  }
}
