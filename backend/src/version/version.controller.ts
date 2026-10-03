import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { VersionService } from "./version.service";

@ApiTags("version")
@Controller()
export class VersionController {
  constructor(private readonly version: VersionService) {}

  @Get("version")
  getVersion() {
    return { version: this.version.get() };
  }

  @Get("version.json")
  getVersionJson() {
    return { version: this.version.get() };
  }
}
