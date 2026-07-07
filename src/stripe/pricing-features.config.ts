export interface PlanConfig {
  displayName: string
  popular: boolean
  features: string[]
}

export const PRICING_FEATURES: Record<string, PlanConfig> = {
  FREE: {
    displayName: 'Free',
    popular: false,
    features: [
      'Up to 5 applications/day',
      '1 resume profile',
      'Basic job tracker',
      'Application status tracking',
      'Job search access',
    ],
  },

  PRO: {
    displayName: 'Pro',
    popular: true,
    features: [
      'Up to 50 auto-applications/day',
      '5 resume profiles',
      'AI resume tailoring per job',
      'AI cover letter generator',
      'Full application analytics',
      'Priority job matching',
      'Application status tracking',
      'Email support',
    ],
  },

  BUSINESS: {
    displayName: 'Business',
    popular: false,
    features: [
      'Everything in Pro',
      'Up to 200 auto-applications/day',
      'Unlimited resume profiles',
      'Hiring manager email outreach',
      'A/B testing for job titles',
      'Advanced analytics & insights',
      'Team workspace & invite',
      'Priority support',
    ],
  },

}
