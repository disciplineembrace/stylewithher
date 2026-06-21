/**
 * Email notification service for StyleWithHer
 * 
 * Currently logs emails to console. To enable real email delivery:
 * 1. Install resend: npm install resend
 * 2. Set RESEND_API_KEY in .env
 * 3. Uncomment the Resend code below
 * 
 * UPI ID for QR in emails: sagathiyapradip1137-1@okicici
 */

interface EmailPayload {
  to: string
  subject: string
  html: string
}

const ADMIN_EMAIL = 'disciplineembrace@gmail.com'
const SITE_NAME = 'StyleWithHer'

// Log email (used when no email service is configured)
async function logEmail(payload: EmailPayload) {
  console.log(`📧 EMAIL TO: ${payload.to}`)
  console.log(`📧 SUBJECT: ${payload.subject}`)
  console.log(`📧 HTML LENGTH: ${payload.html.length} chars`)
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(orderData: {
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  items: Array<{ productName: string; quantity: number; price: number; color?: string; size?: string }>
  paymentMethod: string
  address: { fullName: string; addressLine1: string; city: string; state: string; pincode: string }
}) {
  const { orderNumber, customerName, customerEmail, total, items, paymentMethod, address } = orderData
  
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${item.color || ''} ${item.size ? `/ ${item.size}` : ''}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0B1F3A; font-size: 28px; margin: 0;">StyleWithHer</h1>
        <p style="color: #D96C8A; font-size: 14px;">Style Together, Stay Together</p>
      </div>
      
      <div style="background: #FFF5F7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #0B1F3A; margin-top: 0;">Order Confirmed! 🎉</h2>
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>Thank you for your order! Your order <strong>${orderNumber}</strong> has been placed successfully.</p>
      </div>

      <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin-top: 0; color: #0B1F3A;">Order Details</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</p>
        <p><strong>Shipping Address:</strong><br/>${address.fullName}<br/>${address.addressLine1}<br/>${address.city}, ${address.state} - ${address.pincode}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="border-bottom: 2px solid #0B1F3A;">
            <th style="text-align: left; padding: 8px 0; color: #0B1F3A;">Product</th>
            <th style="text-align: center; padding: 8px 0; color: #0B1F3A;">Variant</th>
            <th style="text-align: center; padding: 8px 0; color: #0B1F3A;">Qty</th>
            <th style="text-align: right; padding: 8px 0; color: #0B1F3A;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="text-align: right; padding: 16px; background: #0B1F3A; color: white; border-radius: 8px;">
        <p style="margin: 0; font-size: 18px;"><strong>Total: ₹${total.toLocaleString('en-IN')}</strong></p>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
        <p>StyleWithHer | India's Premium Couple Fashion Brand</p>
        <p>Instagram: @Style_withher01</p>
      </div>
    </div>
  `

  // Send to customer
  await logEmail({ to: customerEmail, subject: `Order Confirmed - ${orderNumber} | StyleWithHer`, html })
  
  // Send to admin
  await logEmail({ to: ADMIN_EMAIL, subject: `New Order - ${orderNumber} | ₹${total.toLocaleString('en-IN')}`, html })
}

/**
 * Send order status update email
 */
export async function sendOrderStatusEmail(orderData: {
  orderNumber: string
  customerName: string
  customerEmail: string
  status: string
  trackingNumber?: string
}) {
  const { orderNumber, customerName, customerEmail, status, trackingNumber } = orderData

  const statusMessages: Record<string, string> = {
    confirmed: 'Your order has been confirmed and is being prepared for shipment.',
    processing: 'Your order is being processed and will be shipped soon.',
    shipped: `Your order has been shipped! ${trackingNumber ? `Tracking: ${trackingNumber}` : ''}`,
    delivered: 'Your order has been delivered. We hope you love your purchase!',
    cancelled: 'Your order has been cancelled. If you did not request this, please contact us.',
    returned: 'Your return request has been processed. Refund will be initiated shortly.',
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0B1F3A; font-size: 28px; margin: 0;">StyleWithHer</h1>
      </div>
      <div style="background: #FFF5F7; border-radius: 12px; padding: 24px;">
        <h2 style="color: #0B1F3A; margin-top: 0;">Order Update: ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>Your order <strong>${orderNumber}</strong> status has been updated to <strong>${status}</strong>.</p>
        <p>${statusMessages[status] || `Your order status is now: ${status}.`}</p>
        ${trackingNumber ? `<p style="background: #f0f0f0; padding: 12px; border-radius: 8px; font-family: monospace;">Tracking Number: ${trackingNumber}</p>` : ''}
      </div>
      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
        <p>StyleWithHer | India's Premium Couple Fashion Brand</p>
      </div>
    </div>
  `

  await logEmail({ to: customerEmail, subject: `Order ${orderNumber} - ${status.charAt(0).toUpperCase() + status.slice(1)} | StyleWithHer`, html })
}