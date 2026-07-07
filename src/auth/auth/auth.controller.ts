import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { GoogleAuthGuard } from '../guards/google-auth.guard'
import { Public } from '../decorator/public.decorator'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/redirect')
  @Public()
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const token = await this.authService.googleLogin(req.user)

    const cookieOptions = {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    }

    res.cookie('access_token', token, cookieOptions)

    const frontendUrl = this.configService.get<string>('FRONTEND_URL')
    return res.redirect(`${frontendUrl}/auth/callback`)
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    return this.authService.getProfile(req.user.id)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res() res: Response) {
    res.clearCookie('access_token', { path: '/' })
    return res.json({ message: 'Logged out successfully' })
  }
}
