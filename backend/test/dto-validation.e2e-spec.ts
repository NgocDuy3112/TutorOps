import { BadRequestException, ValidationPipe } from "@nestjs/common";
import {
  CreateAssignmentDto,
  ReviewDropboxSubmissionDto,
} from "../src/assignments/assignments.dto";
import { CreateStudentDto } from "../src/students/students.dto";
import { TeachingSessionDto } from "../src/sessions/sessions.dto";

const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});

async function validate<T>(type: new () => T, value: unknown): Promise<T> {
  return pipe.transform(value, { type: "body", metatype: type });
}

describe("DTO validation", () => {
  it("rejects assignment without students or with invalid UUID", async () => {
    await expect(validate(CreateAssignmentDto, { title: "Task" })).rejects.toBeInstanceOf(BadRequestException);
    await expect(validate(CreateAssignmentDto, { title: "Task", studentIds: ["bad-id"] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects invalid dropbox review data", async () => {
    await expect(
      validate(ReviewDropboxSubmissionDto, {
        studentId: "not-a-uuid",
        score: 11,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects student with negative price or invalid mode", async () => {
    await expect(validate(CreateStudentDto, { name: "Student", defaultPriceVnd: -1 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(validate(CreateStudentDto, { name: "Student", submissionMode: "invalid" })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects session with invalid date or negative price", async () => {
    await expect(validate(TeachingSessionDto, { taughtAt: "not-a-date", priceVnd: 100 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(validate(TeachingSessionDto, { taughtAt: "2026-01-01T10:00:00Z", priceVnd: -1 })).rejects.toBeInstanceOf(BadRequestException);
  });
});
