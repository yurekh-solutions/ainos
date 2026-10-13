import crypto from 'crypto'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || ''

export interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  receipt: string
}

export async function createOrder(amount: number, receipt: string): Promise<RazorpayOrder> {
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt,
      payment_capture: 1
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create order' }))
    throw new Error(error.error?.description || 'Failed to create Razorpay order')
  }

  return response.json()
}

export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')
  return expectedSignature === razorpaySignature
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
  return expectedSignature === signature
}

export const CREDIT_PACKS = [
  { credits: 100, price: 1.50, label: 'Mini Pack', currency: 'USD' },
  { credits: 500, price: 5.00, label: 'Starter Pack', currency: 'USD' },
  { credits: 2000, price: 15.00, label: 'Pro Pack', popular: true, currency: 'USD' },
  { credits: 5000, price: 35.00, label: 'Business Pack', currency: 'USD' },
  { credits: 10000, price: 60.00, label: 'Enterprise Pack', currency: 'USD' }
]
