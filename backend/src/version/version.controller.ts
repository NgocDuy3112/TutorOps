import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { VersionService } from "./version.service";

@ApiTags("version")
@Controller()
export class VersionController {
  constructor(private readonly version: VersionService) {}

  // Kept for API clients; browsers hit /version.json so the update banner
  // works even when a front proxy routes that path to the backend instead
  // of the frontend's nginx static file.
  @Get("version")
  getVersion() {
    return { version: this.version.get() };
  }

  @Get("version.json")
  getVersionJson() {
    return { version: this.version.get() };
  }
}
