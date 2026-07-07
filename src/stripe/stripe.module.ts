import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { StripeService } from './stripe.service'
import { BillingService } from './billing.service'
import { StripeWebhookService } from './stripe-webhook.service'
import { StripeController } from './stripe.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [StripeService, BillingService, StripeWebhookService],
  controllers: [StripeController],
  exports: [StripeService, BillingService],
})
export class StripeModule {}
