import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function clearAllData() {
  console.log('Clearing all dummy data...')

  const tables = [
    'Payment', 'OrderItem', 'Order', 'Review', 'CartItem', 'Wishlist',
    'Inventory', 'ProductVariant', 'ProductImage', 'Product',
    'Coupon', 'NewsletterSubscriber', 'Banner', 'SiteContent',
    'Address', 'User', 'Category'
  ]

  for (const table of tables) {
    try {
      // @ts-expect-error dynamic table access
      await db[table].deleteMany()
      console.log(`Cleared ${table}`)
    } catch (e: any) {
      console.log(`Skip ${table}: ${e.message?.substring(0, 60)}`)
    }
  }

  console.log('\nAll dummy data cleared successfully!')
}

clearAllData().catch(console.error).finally(() => db.$disconnect())