import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super({
      accessType: 'offline',
      prompt: 'consent',
    })
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await (super.canActivate(context) as Promise<boolean>)
    } catch (error) {
      const response = context.switchToHttp().getResponse()
      const frontendUrl = this.configService.get<string>('FRONTEND_URL')
      response.redirect(`${frontendUrl}/auth/callback?error=google_auth_failed`)
      return false
    }
  }

  handleRequest(err: any, user: any) {
    if (err || !user) return user ?? null
    return user
  }
}
