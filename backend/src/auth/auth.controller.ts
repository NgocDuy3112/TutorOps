import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "./auth.guard";

const SESSION_COOKIE = "tutorops_session";
import { AuthService } from "./auth.service";
import { CredentialsDto } from "./auth.dto";
import { UpdateProfileDto, ChangePasswordDto } from "./profile.dto";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("register")
  @ApiOperation({ summary: "Register teacher" })
  async register(
    @Body() body: CredentialsDto,
    @Res({ passthrough: true }) response: HttpResponse,
  ) {
    return this.setSession(
      response,
      this.auth.register(body.email, body.password, body.rememberMe),
    );
  }
  @Get("google") google() {
    return this.auth.getGoogleUrl();
  }
  @Get("google/callback") async googleCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() response: HttpResponse,
  ) {
    const result = await this.auth.googleCallback(code, state);
    this.setCookie(response, result.token, true);
    return response.redirect(process.env.FRONTEND_URL ?? "http://localhost:5173");
  }
  @Post("login") @ApiOperation({ summary: "Login teacher" }) async login(
    @Body() body: CredentialsDto,
    @Res({ passthrough: true }) response: HttpResponse,
  ) {
    return this.setSession(
      response,
      this.auth.login(body.email, body.password, body.rememberMe),
    );
  }
  @Get("me") @UseGuards(AuthGuard) async me(@Req() request: AuthenticatedRequest) {
    return this.auth.profile(request.user.id);
  }
  @Patch("profile") @UseGuards(AuthGuard) updateProfile(@Req() request: AuthenticatedRequest, @Body() body: UpdateProfileDto) {
    return this.auth.updateProfile(request.user.id, body);
  }
  @Patch("password") @UseGuards(AuthGuard) changePassword(@Req() request: AuthenticatedRequest, @Body() body: ChangePasswordDto) {
    return this.auth.changePassword(request.user.id, body);
  }
  @Post("logout") async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: HttpResponse,
  ) {
    await this.auth.logout(request.cookies?.[SESSION_COOKIE]);
    response.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  }
  private async setSession(response: HttpResponse, sessionPromise: Promise<any>) {
    const result = await sessionPromise;
    this.setCookie(response, result.token, Boolean(result.user));
    return { user: result.user };
  }
  private setCookie(response: HttpResponse, token: string, rememberMe: boolean) {
    response.cookie("tutorops_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: rememberMe ? 30 * 86400 : 86400,
    });
  }
}
