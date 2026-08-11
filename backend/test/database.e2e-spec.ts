import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { pool, redis } from "../src/db/client";

const email = `e2e-${Date.now()}@example.com`;

describe("TutorOps database E2E", () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  let sessionCookie: string;
  let studentId: string;
  let studentToken: string;
  let parentToken: string;
  let assignmentId: string;

  beforeAll(async () => {
    await redis.connect();
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
    await redis.quit();
    await pool.end();
  });

  it("registers teacher and creates session cookie", async () => {
    const register = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password: "password123" })
      .expect(201);
    sessionCookie = register.headers["set-cookie"][0].split(";")[0];
    expect(register.body.user.email).toBe(email);
    await request(app.getHttpServer())
      .get("/auth/me")
      .set("Cookie", [sessionCookie])
      .expect(200)
      .expect(({ body }) => expect(body.email).toBe(email));
  });

  it("creates student and generates both access tokens", async () => {
    const response = await request(app.getHttpServer())
      .post("/students")
      .set("Cookie", [sessionCookie])
      .send({
        name: "Database Student",
        defaultPriceVnd: 150000,
        submissionMode: "self_submit",
      })
      .expect(201);
    studentId = response.body.id;
    studentToken = response.body.studentToken;
    parentToken = response.body.parentToken;
    expect(studentToken).toBeTruthy();
    expect(parentToken).toBeTruthy();
    await request(app.getHttpServer())
      .get(`/public/students?token=${studentToken}`)
      .expect(200)
      .expect(({ body }) => expect(body.student.studentId).toBe(studentId));
  });

  it("blocks another teacher from accessing the student", async () => {
    const other = request.agent(app.getHttpServer());
    const otherRegister = await other
      .post("/auth/register")
      .send({
        email: `e2e-other-${Date.now()}@example.com`,
        password: "password123",
      })
      .expect(201);
    const otherCookie = otherRegister.headers["set-cookie"][0].split(";")[0];
    await request(app.getHttpServer())
      .get(`/students/${studentId}/sessions`)
      .set("Cookie", otherCookie)
      .expect(404);
  });

  it("creates assignment, teaching session, payment, and parent report", async () => {
    const assignment = await request(app.getHttpServer())
      .post("/assignments")
      .set("Cookie", [sessionCookie])
      .send({ title: "DB Assignment", studentIds: [studentId] })
      .expect(201);
    assignmentId = assignment.body.id;
    await request(app.getHttpServer())
      .post(`/students/${studentId}/sessions`)
      .set("Cookie", [sessionCookie])
      .send({ taughtAt: new Date().toISOString(), priceVnd: 150000 })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/students/${studentId}/payments`)
      .set("Cookie", [sessionCookie])
      .send({ amountVnd: 50000 })
      .expect(201);
    await request(app.getHttpServer())
      .get(`/students/${studentId}/payments`)
      .set("Cookie", [sessionCookie])
      .expect(200)
      .expect(({ body }) => {
        expect(body.totalDue).toBe(150000);
        expect(body.totalPaid).toBe(50000);
        expect(body.balance).toBe(100000);
      });
    await request(app.getHttpServer())
      .get(`/public/parents?token=${parentToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.student.id).toBe(studentId);
        expect(body.assignments[0].title).toBe("DB Assignment");
      });
  });

  it("rejects invalid DTO data", async () => {
    await request(app.getHttpServer())
      .post("/students")
      .set("Cookie", [sessionCookie])
      .send({ name: "", defaultPriceVnd: -1, unexpected: true })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/students/${studentId}/payments`)
      .set("Cookie", [sessionCookie])
      .send({ amountVnd: 0 })
      .expect(400);
  });

  it("regenerates token and revokes old token", async () => {
    const oldToken = studentToken;
    const response = await request(app.getHttpServer())
      .post(`/students/${studentId}/access-tokens/student`)
      .set("Cookie", [sessionCookie])
      .expect(201);
    studentToken = response.body.token;
    await request(app.getHttpServer())
      .get(`/public/students?token=${oldToken}`)
      .expect(401);
    await request(app.getHttpServer())
      .get(`/public/students?token=${studentToken}`)
      .expect(200);
    expect(assignmentId).toBeTruthy();
  });
});
