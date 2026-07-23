export interface CheckoutResult {
  url: string
  providerSubscriptionId: string
}

export interface NormalizedSubscriptionEvent {
  userId: string
  status: 'active' | 'cancelled'
  plan: 'monthly' | 'yearly' | null
  expiresAt: string | null
  providerSubscriptionId: string | null
  providerCustomerId: string | null
  providerPaymentId: string | null
}

export interface PaymentProvider {
  name: string
  createSubscription(params: { userId: string; billing: 'monthly' | 'yearly' }): Promise<CheckoutResult>
  verifyWebhookSignature(req: Request, dataId: string): Promise<boolean>
  parseWebhookEvent(payload: any): Promise<NormalizedSubscriptionEvent | null>
}
