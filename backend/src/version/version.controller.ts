import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { VersionService } from "./version.service";

@ApiTags("version")
@Controller()
export class VersionController {
  constructor(private readonly version: VersionService) {}

  // Kept for API clients; browsers hit /version.json which nginx serves as
  // a static file (this endpoint is the fallback when the proxy routes the
  // path to the backend instead). The frontend no longer polls it — new
  // versions are announced via push instead of the old update banner.
  @Get("version")
  getVersion() {
    return { version: this.version.get() };
  }

  @Get("version.json")
  getVersionJson() {
    return { version: this.version.get() };
  }
}
