import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common'
import { StripeService } from './stripe.service'
import { StripeWebhookService } from './stripe-webhook.service'
import { BillingService } from './billing.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CreateCheckoutDto } from './dto/create-checkout.dto'
import { Public } from '../auth/decorator/public.decorator'

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly webhookService: StripeWebhookService,
    private readonly billingService: BillingService,
  ) {}

  @Get('pricing')
  @Public()
  async getPricing() {
    return this.stripeService.getPricingPlans()
  }

  @Get('subscription-status')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionStatus(@Request() req) {
    return this.stripeService.getSubscriptionStatus(req.user.id)
  }

  @Get('billing-info')
  @UseGuards(JwtAuthGuard)
  async getBillingInfo(@Request() req) {
    return this.billingService.getBillingInfo(req.user.id)
  }

  @Get('estimated-costs')
  @UseGuards(JwtAuthGuard)
  async getEstimatedCosts(@Request() req) {
    return this.billingService.getEstimatedCosts(req.user.id)
  }

  @Post('create-subscription-session')
  @UseGuards(JwtAuthGuard)
  async createSubscriptionSession(@Body() dto: CreateCheckoutDto, @Request() req) {
    return this.stripeService.createSubscriptionSession(req.user.id, dto.stripePriceId, dto.flowType)
  }

  @Post('webhook')
  @Public()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.webhookService.handleWebhook(signature, (req as any).rawBody)
  }
}
