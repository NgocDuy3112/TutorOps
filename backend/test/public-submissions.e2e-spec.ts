import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { SubmissionsController } from "../src/submissions/submissions.controller";
import { SubmissionsService } from "../src/submissions/submissions.service";
import { FilesService } from "../src/files/files.service";
import { AccessService } from "../src/access/access.service";

describe("Public submissions", () => {
  let app: INestApplication;
  const submissions = {
    create: jest.fn().mockResolvedValue({ id: "submission-1" }),
  };
  const files = { upload: jest.fn().mockResolvedValue({ id: "file-1" }) };
  const access = {
    authenticate: jest.fn().mockResolvedValue({ studentId: "student-1" }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SubmissionsController],
      providers: [
        { provide: SubmissionsService, useValue: submissions },
        { provide: FilesService, useValue: files },
        { provide: AccessService, useValue: access },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it("accepts multipart files with student token", async () => {
    await request(app.getHttpServer())
      .post("/public/submissions")
      .query({ token: "student-token", assignmentId: "assignment-1" })
      .attach("files", Buffer.from("fake-image"), "homework.jpg")
      .expect(201)
      .expect({ id: "submission-1" });

    expect(access.authenticate).toHaveBeenCalledWith(
      "student-token",
      "student",
    );
    expect(files.upload).toHaveBeenCalled();
    expect(submissions.create).toHaveBeenCalledWith(
      "student-token",
      "assignment-1",
      { fileIds: ["file-1"] },
    );
  });

  it("rejects request without files", async () => {
    await request(app.getHttpServer())
      .post("/public/submissions")
      .query({ token: "student-token", assignmentId: "assignment-1" })
      .expect(400);
  });
});
