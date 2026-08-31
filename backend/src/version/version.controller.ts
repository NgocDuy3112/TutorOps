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
}
