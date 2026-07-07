export interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  stripePriceId: string
  stripeProductId?: string
  popular: boolean
  features: string[]
}
