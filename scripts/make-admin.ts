import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  await db.user.update({ where: { email: 'admin@stylewithher.com' }, data: { role: 'admin', isVerified: true } })
  console.log('Admin role set successfully')
}
main().finally(() => db.$disconnect())
