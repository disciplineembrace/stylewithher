const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = ['User', 'Product', 'Category', 'Order', 'OrderItem', 'CartItem', 'Wishlist', 'Review', 'Address', 'Coupon', 'Banner', 'NewsletterSubscriber', 'Post', 'MediaFile', 'AuditLog', 'SiteContent', 'Payment'];
  for (const t of tables) {
    try {
      // eslint-disable-next-line no-template-curly-in-string
      const count = await prisma.$queryRawUnsafe(`SELECT count(*)::int as c FROM "${t === 'Order' ? 'Order' : t}"`);
      console.log(`${t}: ${count[0].c}`);
    } catch(e) {
      console.log(`${t}: ERROR - ${e.message.substring(0, 60)}`);
    }
  }
  // List users
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, isActive: true } });
  console.log('\n--- USERS ---');
  users.forEach(u => console.log(`  ${u.email} | role=${u.role} | active=${u.isActive}`));
  
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); prisma.$disconnect(); });