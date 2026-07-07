import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthService } from './auth/auth.service'
import { AuthController } from './auth/auth.controller'
import { GoogleStrategy } from './strategies/google.strategy/google.strategy'
import { JwtStrategy } from './strategies/jwt.strategy/jwt.strategy'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { GoogleAuthGuard } from './guards/google-auth.guard'
import { PrismaModule } from 'src/prisma/prisma.module'
import { StripeModule } from 'src/stripe/stripe.module'

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    StripeModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: (configService.get<string>('JWT_EXPIRY', '7d') as any) },
      }),
    }),
  ],
  providers: [AuthService, GoogleStrategy, JwtStrategy, JwtAuthGuard, GoogleAuthGuard, ConfigService],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, JwtStrategy],
})
export class AuthModule {}
