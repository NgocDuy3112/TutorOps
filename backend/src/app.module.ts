import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { StudentsModule } from "./students/students.module";
import { SessionsModule } from "./sessions/sessions.module";
import { AssignmentsModule } from "./assignments/assignments.module";
import { StorageModule } from "./storage/storage.module";
import { FilesModule } from "./files/files.module";
import { LessonsModule } from "./lessons/lessons.module";
import { AccessModule } from "./access/access.module";
import { PaymentsModule } from "./payments/payments.module";
import { SubmissionsModule } from "./submissions/submissions.module";
import { NotificationsModule } from "./notifications/notifications.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    StudentsModule,
    SessionsModule,
    AssignmentsModule,
    StorageModule,
    FilesModule,
    LessonsModule,
    AccessModule,
    PaymentsModule,
    SubmissionsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
