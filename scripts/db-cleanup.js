const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  
  console.log('=== STEP 1: DATA CLEANUP ===');
  
  // Delete all dummy data (keep structure)
  const delOrderItem = await prisma.orderItem.deleteMany();
  console.log(`Deleted OrderItems: ${delOrderItem.count}`);
  
  const delCart = await prisma.cartItem.deleteMany();
  console.log(`Deleted CartItems: ${delCart.count}`);
  
  const delWishlist = await prisma.wishlist.deleteMany();
  console.log(`Deleted Wishlists: ${delWishlist.count}`);
  
  const delReview = await prisma.review.deleteMany();
  console.log(`Deleted Reviews: ${delReview.count}`);
  
  const delAddress = await prisma.address.deleteMany();
  console.log(`Deleted Addresses: ${delAddress.count}`);
  
  const delPayment = await prisma.payment.deleteMany();
  console.log(`Deleted Payments: ${delPayment.count}`);
  
  const delOrder = await prisma.order.deleteMany();
  console.log(`Deleted Orders: ${delOrder.count}`);
  
  const delPost = await prisma.post.deleteMany();
  console.log(`Deleted Posts: ${delPost.count}`);
  
  const delMedia = await prisma.mediaFile.deleteMany();
  console.log(`Deleted MediaFiles: ${delMedia.count}`);
  
  const delAudit = await prisma.auditLog.deleteMany();
  console.log(`Deleted AuditLogs: ${delAudit.count}`);
  
  const delNewsletter = await prisma.newsletterSubscriber.deleteMany();
  console.log(`Deleted NewsletterSubscribers: ${delNewsletter.count}`);
  
  const delBanner = await prisma.banner.deleteMany();
  console.log(`Deleted Banners: ${delBanner.count}`);
  
  const delSiteContent = await prisma.siteContent.deleteMany();
  console.log(`Deleted SiteContent: ${delSiteContent.count}`);
  
  const delCoupon = await prisma.coupon.deleteMany();
  console.log(`Deleted Coupons: ${delCoupon.count}`);
  
  const delProduct = await prisma.product.deleteMany();
  console.log(`Deleted Products: ${delProduct.count}`);
  
  const delCategory = await prisma.category.deleteMany();
  console.log(`Deleted Categories: ${delCategory.count}`);
  
  // Delete ALL existing users
  const delUsers = await prisma.user.deleteMany();
  console.log(`Deleted Users: ${delUsers.count}`);

  console.log('\n=== STEP 2: CREATE MAIN ADMIN ===');
  const hashedPassword = await bcrypt.hash('deval@1808', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'StyleWithHer Admin',
      email: 'disciplineembrace@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      isActive: true,
      phone: null,
      avatar: null,
    },
  });
  console.log(`Created Admin: ${admin.email} (role=${admin.role}, verified=${admin.isVerified})`);

  // Verify the hash works
  const valid = await bcrypt.compare('deval@1808', admin.password);
  console.log(`Password verification: ${valid ? 'PASS' : 'FAIL'}`);

  console.log('\n=== CLEANUP COMPLETE ===');
  
  // Final count
  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  const orderCount = await prisma.order.count();
  console.log(`Remaining - Users: ${userCount}, Products: ${productCount}, Orders: ${orderCount}`);
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });