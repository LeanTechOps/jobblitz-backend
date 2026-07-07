import { Injectable, BadRequestException } from '@nestjs/common'
import { SubscriptionPlan } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getBillingInfo(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true },
    })

    if (!subscription) throw new BadRequestException('No subscription found for this user')

    if (subscription.plan === SubscriptionPlan.FREE) {
      return this.getFreePlanInfo(userId)
    }

    return this.getBillingPeriodInfo(userId)
  }

  private async getFreePlanInfo(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true },
    })

    if (!subscription) throw new BadRequestException('No subscription found for this user')

    return {
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        price: 0,
      },
      billingPeriod: null,
      usage: {
        paymentsSucceeded: 0,
        paymentsFailed: 0,
        paymentsTotal: 0,
        totalPaid: 0,
      },
      cancellation: {
        isCanceled: false,
        cancelAt: null,
        willCancelAtPeriodEnd: false,
      },
    }
  }

  private async getBillingPeriodInfo(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        id: true,
        plan: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        currentPrice: true,
        cancelAt: true,
        cancelAtPeriodEnd: true,
      },
    })

    if (!subscription) throw new BadRequestException('No subscription found for this user')

    if (!subscription.currentPeriodEnd) {
      return this.getFreePlanInfo(userId)
    }

    const now = new Date()
    const periodStart = subscription.currentPeriodStart || now
    const periodEnd = subscription.currentPeriodEnd

    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
    const daysElapsed = Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.max(0, totalDays - daysElapsed)

    const [succeeded, failed, total, sum] = await Promise.all([
      this.prisma.payment.count({
        where: {
          subscriptionId: subscription.id,
          status: 'SUCCEEDED',
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      this.prisma.payment.count({
        where: {
          subscriptionId: subscription.id,
          status: 'FAILED',
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      this.prisma.payment.count({
        where: { subscriptionId: subscription.id, createdAt: { gte: periodStart, lte: periodEnd } },
      }),
      this.prisma.payment.aggregate({
        where: {
          subscriptionId: subscription.id,
          status: 'SUCCEEDED',
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amount: true },
      }),
    ])

    return {
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        price: subscription.currentPrice,
      },
      billingPeriod: {
        start: periodStart,
        end: periodEnd,
        daysTotal: totalDays,
        daysElapsed,
        daysRemaining,
        percentComplete: totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0,
      },
      usage: {
        paymentsSucceeded: succeeded,
        paymentsFailed: failed,
        paymentsTotal: total,
        totalPaid: sum._sum.amount || 0,
      },
      cancellation: {
        isCanceled: subscription.cancelAtPeriodEnd,
        cancelAt: subscription.cancelAt,
        willCancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    }
  }

  async getEstimatedCosts(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        id: true,
        plan: true,
        status: true,
        currentPrice: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
      },
    })

    if (!subscription) throw new BadRequestException('No subscription found for this user')

    if (!subscription.currentPeriodEnd) {
      return {
        subscription: { plan: subscription.plan, status: subscription.status },
        period: null,
        costs: {
          currency: 'usd',
          basePlanPrice: 0,
          totalPaid: 0,
          totalPending: 0,
          estimatedRemaining: 0,
          estimatedTotal: 0,
        },
        breakdown: { succeededPaymentsCount: 0, pendingPaymentsCount: 0 },
      }
    }

    const now = new Date()
    const periodStart = subscription.currentPeriodStart || now
    const periodEnd = subscription.currentPeriodEnd

    const payments = await this.prisma.payment.findMany({
      where: {
        subscriptionId: subscription.id,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      select: { amount: true, status: true },
    })

    const succeeded = payments.filter(p => p.status === 'SUCCEEDED')
    const totalPaid = succeeded.reduce((s, p) => s + Number(p.amount), 0)
    const pending = payments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
    const totalPending = pending.reduce((s, p) => s + Number(p.amount), 0)
    const basePrice = Number(subscription.currentPrice) || 0
    const estimatedRemaining = Math.max(0, basePrice - totalPaid - totalPending)

    return {
      subscription: { plan: subscription.plan, status: subscription.status },
      period: { start: periodStart, end: periodEnd },
      costs: {
        currency: 'usd',
        basePlanPrice: basePrice,
        totalPaid,
        totalPending,
        estimatedRemaining,
        estimatedTotal: totalPaid + totalPending + estimatedRemaining,
      },
      breakdown: {
        succeededPaymentsCount: succeeded.length,
        pendingPaymentsCount: pending.length,
      },
    }
  }
}
