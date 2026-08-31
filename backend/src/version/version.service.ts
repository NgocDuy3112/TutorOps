import { Injectable } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { join } from "node:path";

@Injectable()
export class VersionService {
  private readonly version: string;

  constructor() {
    this.version = process.env.APP_VERSION ?? this.readPackageVersion();
  }

  get(): string {
    return this.version;
  }

  private readPackageVersion(): string {
    try {
      const pkg = JSON.parse(
        readFileSync(join(__dirname, "..", "..", "package.json"), "utf-8"),
      );
      return pkg.version ?? "0.0.0";
    } catch {
      return "0.0.0";
    }
  }
}
