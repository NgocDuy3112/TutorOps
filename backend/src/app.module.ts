import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { StudentsModule } from "./students/students.module";
import { SessionsModule } from "./sessions/sessions.module";
import { AssignmentsModule } from "./assignments/assignments.module";
import { StorageModule } from "./storage/storage.module";
import { FilesModule } from "./files/files.module";
import { AccessModule } from "./access/access.module";
import { PaymentsModule } from "./payments/payments.module";
import { SubmissionsModule } from "./submissions/submissions.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { TuitionModule } from "./tuition/tuition.module";
import { ClassesModule } from "./classes/classes.module";
import { OcrModule } from "./ocr/ocr.module";
import { CommonModule } from "./common/common.module";
import { VersionModule } from "./version/version.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
    StudentsModule,
    SessionsModule,
    AssignmentsModule,
    StorageModule,
    FilesModule,
    AccessModule,
    PaymentsModule,
    SubmissionsModule,
    NotificationsModule,
    DashboardModule,
    TuitionModule,
    ClassesModule,
    OcrModule,
    VersionModule,
  ],
})
export class AppModule {}
