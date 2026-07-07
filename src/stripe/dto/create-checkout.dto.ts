import { IsOptional, IsString } from 'class-validator'

export class CreateCheckoutDto {
  @IsOptional()
  @IsString()
  stripePriceId?: string

  @IsOptional()
  @IsString()
  flowType?: 'subscription_update'
}
