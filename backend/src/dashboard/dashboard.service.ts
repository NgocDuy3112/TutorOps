import { Injectable } from "@nestjs/common";
import { DashboardRepository } from "./dashboard.repository";

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  calendar(teacherId: string) {
    return this.repository.calendar(teacherId);
  }
}
