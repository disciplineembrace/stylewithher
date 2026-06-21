import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('Seeding clean database...')

  // Create ONLY the single admin account
  const adminPassword = await bcrypt.hash('deval@1808', 12) // Higher rounds for security
  const admin = await db.user.upsert({
    where: { email: 'disciplineembrace@gmail.com' },
    update: {
      name: 'StyleWithHer Admin',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      isActive: true,
    },
    create: {
      name: 'StyleWithHer Admin',
      email: 'disciplineembrace@gmail.com',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      isActive: true,
    }
  })
  console.log(`Admin created: ${admin.email}`)

  // Create essential site content only
  const siteContents = [
    { key: 'about_us', value: 'StyleWithHer is India\'s premium couple fashion brand, dedicated to helping couples express their love through matching fashion. Founded in 2023, we believe that style is a beautiful way to celebrate togetherness.', type: 'text' },
    { key: 'contact_email', value: 'disciplineembrace@gmail.com', type: 'text' },
    { key: 'contact_phone', value: '', type: 'text' },
    { key: 'contact_address', value: '', type: 'text' },
    { key: 'social_instagram', value: 'https://instagram.com/Style_withher01', type: 'text' },
    { key: 'social_facebook', value: '', type: 'text' },
    { key: 'social_twitter', value: '', type: 'text' },
    { key: 'social_youtube', value: '', type: 'text' },
    { key: 'social_pinterest', value: '', type: 'text' },
    { key: 'shipping_policy', value: 'Free shipping on orders above Rs.999. Standard delivery takes 3-5 business days.', type: 'text' },
    { key: 'return_policy', value: 'Easy returns within 15 days of delivery. Items must be unused with original tags. Refunds processed within 5-7 business days.', type: 'text' },
    { key: 'site_name', value: 'StyleWithHer', type: 'text' },
    { key: 'site_tagline', value: 'Premium Couple Fashion', type: 'text' },
    { key: 'site_description', value: 'India\'s premium couple fashion brand - Matching styles for every occasion', type: 'text' },
    { key: 'upi_id', value: 'sagathiyapradip1137-1@okicici', type: 'text' },
    { key: 'currency', value: 'INR', type: 'text' },
    { key: 'currency_symbol', value: '₹', type: 'text' },
  ]
  for (const sc of siteContents) {
    await db.siteContent.upsert({
      where: { key: sc.key },
      update: { value: sc.value },
      create: sc,
    })
  }

  console.log('Clean database seeded successfully!')
  console.log('Admin credentials: disciplineembrace@gmail.com / deval@1808')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())