import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

const categories = [
  { name: 'Couple T-Shirts', slug: 'couple-tshirts', description: 'Matching t-shirts for couples', gender: 'couple', sortOrder: 1 },
  { name: 'Couple Hoodies', slug: 'couple-hoodies', description: 'Cozy matching hoodies', gender: 'couple', sortOrder: 2 },
  { name: 'Couple Jackets', slug: 'couple-jackets', description: 'Stylish couple jackets', gender: 'couple', sortOrder: 3 },
  { name: 'Women Tops', slug: 'women-tops', description: 'Trendy tops for her', gender: 'women', sortOrder: 4 },
  { name: 'Men Shirts', slug: 'men-shirts', description: 'Premium shirts for him', gender: 'men', sortOrder: 5 },
  { name: 'Couple Dresses', slug: 'couple-dresses', description: 'Matching dress sets', gender: 'couple', sortOrder: 6 },
  { name: 'Accessories', slug: 'accessories', description: 'Matching accessories', gender: 'unisex', sortOrder: 7 },
  { name: 'Couple Nightwear', slug: 'couple-nightwear', description: 'Comfortable nightwear sets', gender: 'couple', sortOrder: 8 },
]

const colors = ['Navy Blue', 'Soft Pink', 'White', 'Black', 'Blush', 'Rose', 'Charcoal', 'Cream', 'Lavender', 'Sage Green']
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const products = [
  { name: 'Eternal Bond Couple Tee', slug: 'eternal-bond-couple-tee', categoryId: 0, basePrice: 1499, salePrice: 999, gender: 'couple', isFeatured: true, isTrending: true, isNewArrival: false, isBestSeller: true, material: '100% Premium Cotton', care: 'Machine wash cold, tumble dry low', totalSold: 342 },
  { name: 'Love Story Matching Hoodie', slug: 'love-story-matching-hoodie', categoryId: 1, basePrice: 2499, salePrice: 1899, gender: 'couple', isFeatured: true, isTrending: true, isNewArrival: true, isBestSeller: true, material: 'Cotton-Polyester Blend', care: 'Machine wash cold, hang dry', totalSold: 256 },
  { name: 'Togetherness Couple Jacket', slug: 'togetherness-couple-jacket', categoryId: 2, basePrice: 3999, salePrice: 2999, gender: 'couple', isFeatured: true, isTrending: false, isNewArrival: true, isBestSeller: false, material: 'Premium Fleece Lined', care: 'Dry clean only', totalSold: 89 },
  { name: 'Blossom Women Crop Top', slug: 'blossom-women-crop-top', categoryId: 3, basePrice: 999, salePrice: 699, gender: 'women', isFeatured: true, isTrending: true, isNewArrival: true, isBestSeller: false, material: '95% Cotton, 5% Spandex', care: 'Machine wash cold', totalSold: 178 },
  { name: 'Classic Heritage Men Shirt', slug: 'classic-heritage-men-shirt', categoryId: 4, basePrice: 1999, salePrice: 1499, gender: 'men', isFeatured: true, isTrending: false, isNewArrival: false, isBestSeller: true, material: '100% Linen Cotton', care: 'Machine wash warm', totalSold: 412 },
  { name: 'Romantic Sunset Couple Set', slug: 'romantic-sunset-couple-set', categoryId: 5, basePrice: 4999, salePrice: 3799, gender: 'couple', isFeatured: true, isTrending: true, isNewArrival: true, isBestSeller: false, material: 'Silk Blend', care: 'Hand wash, dry flat', totalSold: 67 },
  { name: 'Infinity Love Bracelet Set', slug: 'infinity-love-bracelet-set', categoryId: 6, basePrice: 799, salePrice: 599, gender: 'unisex', isFeatured: false, isTrending: true, isNewArrival: true, isBestSeller: true, material: 'Stainless Steel, 18K Gold Plated', care: 'Avoid water contact', totalSold: 523 },
  { name: 'Cozy Dreams Couple Pajama', slug: 'cozy-dreams-couple-pajama', categoryId: 7, basePrice: 1799, salePrice: 1299, gender: 'couple', isFeatured: false, isTrending: false, isNewArrival: true, isBestSeller: true, material: '100% Soft Cotton', care: 'Machine wash cold', totalSold: 389 },
  { name: 'Soulmate Matching Tee', slug: 'soulmate-matching-tee', categoryId: 0, basePrice: 1299, salePrice: 899, gender: 'couple', isFeatured: true, isTrending: true, isNewArrival: false, isBestSeller: true, material: 'Organic Cotton', care: 'Machine wash cold', totalSold: 467 },
  { name: 'Urban Couple Bomber Jacket', slug: 'urban-couple-bomber-jacket', categoryId: 2, basePrice: 4499, salePrice: 3499, gender: 'couple', isFeatured: false, isTrending: true, isNewArrival: true, isBestSeller: false, material: 'Nylon-Polyester Blend', care: 'Machine wash cold', totalSold: 124 },
  { name: 'Elegant V-Neck Women Blouse', slug: 'elegant-v-neck-women-blouse', categoryId: 3, basePrice: 1499, salePrice: 1099, gender: 'women', isFeatured: true, isTrending: false, isNewArrival: false, isBestSeller: true, material: 'Rayon, Spandex', care: 'Hand wash recommended', totalSold: 298 },
  { name: 'Premium Oxford Men Shirt', slug: 'premium-oxford-men-shirt', categoryId: 4, basePrice: 2299, salePrice: 1799, gender: 'men', isFeatured: false, isTrending: true, isNewArrival: true, isBestSeller: false, material: '100% Oxford Cotton', care: 'Machine wash warm', totalSold: 189 },
  { name: 'Heartbeat Matching Sweatshirt', slug: 'heartbeat-matching-sweatshirt', categoryId: 1, basePrice: 2199, salePrice: 1699, gender: 'couple', isFeatured: true, isTrending: true, isNewArrival: false, isBestSeller: true, material: 'French Terry Cotton', care: 'Machine wash cold', totalSold: 356 },
  { name: 'King & Queen Crown Set', slug: 'king-queen-crown-set', categoryId: 6, basePrice: 599, salePrice: 449, gender: 'unisex', isFeatured: false, isTrending: true, isNewArrival: true, isBestSeller: true, material: 'Alloy, Cubic Zirconia', care: 'Store in cool dry place', totalSold: 678 },
  { name: 'Moonlit Couple Night Gown', slug: 'moonlit-couple-night-gown', categoryId: 7, basePrice: 1999, salePrice: 1499, gender: 'couple', isFeatured: false, isTrending: false, isNewArrival: true, isBestSeller: false, material: 'Silk Satin', care: 'Hand wash, hang dry', totalSold: 145 },
  { name: 'Retro Vibes Couple Tee', slug: 'retro-vibes-couple-tee', categoryId: 0, basePrice: 1399, salePrice: 949, gender: 'couple', isFeatured: false, isTrending: true, isNewArrival: true, isBestSeller: false, material: '100% Combed Cotton', care: 'Machine wash cold', totalSold: 213 },
  { name: 'Winter Hug Couple Hoodie', slug: 'winter-hug-couple-hoodie', categoryId: 1, basePrice: 2799, salePrice: 2199, gender: 'couple', isFeatured: true, isTrending: false, isNewArrival: false, isBestSeller: true, material: 'Heavyweight Fleece', care: 'Machine wash cold, hang dry', totalSold: 445 },
  { name: 'Denim Love Couple Jacket', slug: 'denim-love-couple-jacket', categoryId: 2, basePrice: 4999, salePrice: 3999, gender: 'couple', isFeatured: true, isTrending: true, isNewArrival: true, isBestSeller: false, material: 'Premium Denim', care: 'Machine wash cold, inside out', totalSold: 167 },
  { name: 'Floral Romance Women Top', slug: 'floral-romance-women-top', categoryId: 3, basePrice: 1199, salePrice: 849, gender: 'women', isFeatured: false, isTrending: true, isNewArrival: true, isBestSeller: false, material: 'Chiffon', care: 'Hand wash, iron low', totalSold: 234 },
  { name: 'Minimalist Men Polo', slug: 'minimalist-men-polo', categoryId: 4, basePrice: 1799, salePrice: 1349, gender: 'men', isFeatured: true, isTrending: false, isNewArrival: false, isBestSeller: true, material: 'Pique Cotton', care: 'Machine wash cold', totalSold: 521 },
]

const banners = [
  { title: 'Style Together, Stay Together', subtitle: 'Discover our new Couple Collection — Premium matching fashion for every occasion', image: '', position: 'home', sortOrder: 1, isActive: true },
  { title: 'Summer Sale 40% Off', subtitle: 'Limited time offer on all trending couple wear', image: '', position: 'home', sortOrder: 2, isActive: true },
  { title: 'New Arrivals', subtitle: 'Fresh styles just dropped — Shop now', image: '', position: 'home', sortOrder: 3, isActive: true },
]

const coupons = [
  { code: 'WELCOME20', description: '20% off on first order', discountType: 'percentage', discountValue: 20, minOrder: 999, maxDiscount: 1000, usageLimit: 1000, startDate: '2025-01-01', endDate: '2026-12-31' },
  { code: 'COUPLE15', description: '15% off on couple collection', discountType: 'percentage', discountValue: 15, minOrder: 1499, maxDiscount: 800, usageLimit: 500, startDate: '2025-01-01', endDate: '2026-12-31' },
  { code: 'FLAT500', description: 'Flat Rs.500 off on orders above Rs.2500', discountType: 'fixed', discountValue: 500, minOrder: 2500, maxDiscount: null, usageLimit: 300, startDate: '2025-06-01', endDate: '2026-12-31' },
  { code: 'SUMMER30', description: '30% off on summer collection', discountType: 'percentage', discountValue: 30, minOrder: 1999, maxDiscount: 1500, usageLimit: 200, startDate: '2025-03-01', endDate: '2026-08-31' },
]

const reviewNames = ['Priya Sharma', 'Rahul Verma', 'Ananya Patel', 'Vikram Singh', 'Meera Reddy', 'Arjun Kumar', 'Ishita Gupta', 'Karan Malhotra', 'Neha Joshi', 'Rohan Desai']
const reviewComments = [
  { rating: 5, title: 'Absolutely love it!', comment: 'The quality is amazing and it fits perfectly. My partner and I get compliments every time we wear this.' },
  { rating: 5, title: 'Best couple purchase', comment: 'Super soft fabric, great stitching, and the colors are exactly as shown. Highly recommend!' },
  { rating: 4, title: 'Great quality', comment: 'Very comfortable and well-made. Slightly longer delivery than expected but worth the wait.' },
  { rating: 5, title: 'Perfect gift', comment: 'Bought this as an anniversary gift and we both loved it. The packaging was beautiful too.' },
  { rating: 4, title: 'Good value for money', comment: 'Nice material and design. Fits true to size. Will definitely order again.' },
  { rating: 5, title: 'Stunning design', comment: 'The design is even more beautiful in person. Premium feel and excellent finish.' },
  { rating: 4, title: 'Comfortable all day', comment: 'Wore it for an entire day out and it was super comfortable. Color hasn\'t faded after washing.' },
  { rating: 5, title: 'Exceeded expectations', comment: 'Wasn\'t expecting such high quality at this price point. Will be buying more!' },
  { rating: 3, title: 'Nice but sizing issue', comment: 'The product quality is good but I had to exchange for a different size. Exchange process was smooth.' },
  { rating: 5, title: 'Our new favorite', comment: 'We\'ve bought 3 matching sets from StyleWithHer now and this is our favorite. Top notch quality!' },
]

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  const admin = await db.user.upsert({
    where: { email: 'admin@stylewithher.com' },
    update: {},
    create: {
      name: 'StyleWithHer Admin',
      email: 'admin@stylewithher.com',
      password: adminPassword,
      phone: '+91 98765 43210',
      role: 'admin',
      isVerified: true,
    }
  })

  // Create demo user
  const userPassword = await bcrypt.hash('User@123', 10)
  const demoUser = await db.user.upsert({
    where: { email: 'demo@stylewithher.com' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'demo@stylewithher.com',
      password: userPassword,
      phone: '+91 98765 12345',
      role: 'customer',
      isVerified: true,
    }
  })

  // Create categories
  const createdCategories = []
  for (const cat of categories) {
    const created = await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        gender: cat.gender,
        sortOrder: cat.sortOrder,
        image: `https://placehold.co/600x400/0B1F3A/F7C8D0?text=${encodeURIComponent(cat.name)}`,
      }
    })
    createdCategories.push(created)
  }

  // Create products with variants, images, inventory, and reviews
  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const catIndex = p.categoryId
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: `Experience the perfect blend of style and comfort with the ${p.name}. Crafted with ${p.material.toLowerCase()}, this piece is designed to make you and your partner look effortlessly stylish together. Whether it's a casual day out or a special date night, this versatile piece will elevate your couple fashion game. The premium quality fabric ensures all-day comfort while the modern design keeps you looking trendy.`,
        basePrice: p.basePrice,
        salePrice: p.salePrice,
        categoryId: createdCategories[catIndex].id,
        gender: p.gender,
        isFeatured: p.isFeatured,
        isTrending: p.isTrending,
        isNewArrival: p.isNewArrival,
        isBestSeller: p.isBestSeller,
        material: p.material,
        care: p.care,
        totalSold: p.totalSold,
        avgRating: 4.2 + Math.random() * 0.8,
        reviewCount: Math.floor(Math.random() * 40) + 10,
      }
    })

    // Create 3-4 product images
    const imgColors = ['Navy Blue', 'Soft Pink', 'White', 'Black']
    for (let j = 0; j < 3 + Math.floor(Math.random() * 2); j++) {
      await db.productImage.create({
        data: {
          url: `https://placehold.co/800x1000/${j % 2 === 0 ? '0B1F3A' : 'FFF5F7'}/${j % 2 === 0 ? 'F7C8D0' : '0B1F3A'}?text=${encodeURIComponent(p.name)}+${j + 1}`,
          alt: `${p.name} - View ${j + 1}`,
          sortOrder: j,
          productId: product.id,
        }
      })
    }

    // Create variants (2-3 colors x 3-4 sizes)
    const productColors = colors.slice(0, 2 + Math.floor(Math.random() * 2))
    const productSizes = sizes.slice(1, 4 + Math.floor(Math.random() * 2))
    for (const color of productColors) {
      for (const size of productSizes) {
        const sku = `${p.slug.slice(0, 6).toUpperCase()}-${color.replace(/\s/g, '').slice(0, 4)}-${size}`
        const variant = await db.productVariant.create({
          data: {
            productId: product.id,
            color,
            size,
            sku,
            price: p.salePrice || p.basePrice,
          }
        })
        // Create inventory
        const stock = Math.floor(Math.random() * 50) + 5
        await db.inventory.create({
          data: {
            variantId: variant.id,
            quantity: stock,
            lowStock: 5,
          }
        })
      }
    }

    // Create reviews
    const numReviews = 2 + Math.floor(Math.random() * 4)
    for (let r = 0; r < numReviews; r++) {
      const reviewData = reviewComments[r % reviewComments.length]
      await db.review.create({
        data: {
          userId: demoUser.id,
          productId: product.id,
          rating: reviewData.rating,
          title: reviewData.title,
          comment: reviewData.comment,
          isApproved: true,
        }
      })
    }
  }

  // Update product review counts and avg ratings
  const allProducts = await db.product.findMany({ include: { reviews: true } })
  for (const prod of allProducts) {
    const approvedReviews = prod.reviews.filter(r => r.isApproved)
    const avgRating = approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : 0
    await db.product.update({
      where: { id: prod.id },
      data: {
        reviewCount: approvedReviews.length,
        avgRating: Math.round(avgRating * 10) / 10,
      }
    })
  }

  // Create banners
  for (const b of banners) {
    await db.banner.upsert({
      where: { id: `banner-${b.sortOrder}` },
      update: {},
      create: {
        id: `banner-${b.sortOrder}`,
        title: b.title,
        subtitle: b.subtitle,
        image: `https://placehold.co/1400x500/0B1F3A/F7C8D0?text=${encodeURIComponent(b.title)}`,
        position: b.position,
        sortOrder: b.sortOrder,
        isActive: b.isActive,
      }
    })
  }

  // Create coupons
  for (const c of coupons) {
    await db.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrder: c.minOrder,
        maxDiscount: c.maxDiscount,
        usageLimit: c.usageLimit,
        startDate: new Date(c.startDate),
        endDate: new Date(c.endDate),
        isActive: true,
      }
    })
  }

  // Create newsletter subscriber
  await db.newsletterSubscriber.upsert({
    where: { email: 'newsletter@stylewithher.com' },
    update: {},
    create: { email: 'newsletter@stylewithher.com', isActive: true }
  })

  // Create demo orders
  const firstProduct = await db.product.findFirst()
  const firstVariant = firstProduct ? await db.productVariant.findFirst({ where: { productId: firstProduct.id } }) : null
  if (firstProduct && firstVariant) {
    // Create address for demo user
    const address = await db.address.create({
      data: {
        userId: demoUser.id,
        label: 'Home',
        fullName: 'Priya Sharma',
        phone: '+91 98765 12345',
        addressLine1: '42, MG Road, Apartment 3B',
        addressLine2: 'Near City Mall',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        isDefault: true,
      }
    })

    // Create completed order
    const order = await db.order.create({
      data: {
        orderNumber: `SWH-${Date.now().toString().slice(-6)}`,
        userId: demoUser.id,
        addressId: address.id,
        status: 'delivered',
        paymentMethod: 'razorpay',
        paymentStatus: 'completed',
        subtotal: firstProduct.salePrice || firstProduct.basePrice,
        discount: 0,
        tax: Math.round((firstProduct.salePrice || firstProduct.basePrice) * 0.18 * 100) / 100,
        shipping: 0,
        total: Math.round((firstProduct.salePrice || firstProduct.basePrice) * 1.18 * 100) / 100,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        shippedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      }
    })

    await db.orderItem.create({
      data: {
        orderId: order.id,
        productId: firstProduct.id,
        variantId: firstVariant.id,
        productName: firstProduct.name,
        productImage: `https://placehold.co/800x1000/0B1F3A/F7C8D0?text=${encodeURIComponent(firstProduct.name)}`,
        color: firstVariant.color,
        size: firstVariant.size,
        quantity: 1,
        price: firstProduct.salePrice || firstProduct.basePrice,
      }
    })

    await db.payment.create({
      data: {
        orderId: order.id,
        userId: demoUser.id,
        amount: order.total,
        method: 'razorpay',
        status: 'completed',
        transactionId: `TXN-${Date.now()}`,
      }
    })

    // Create pending order
    const order2 = await db.order.create({
      data: {
        orderNumber: `SWH-${(Date.now() + 1).toString().slice(-6)}`,
        userId: demoUser.id,
        addressId: address.id,
        status: 'confirmed',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        subtotal: (firstProduct.salePrice || firstProduct.basePrice) * 2,
        discount: 100,
        tax: Math.round(((firstProduct.salePrice || firstProduct.basePrice) * 2 - 100) * 0.18 * 100) / 100,
        shipping: 99,
        total: Math.round(((firstProduct.salePrice || firstProduct.basePrice) * 2 - 100) * 1.18 * 100 + 9900) / 100,
      }
    })

    await db.orderItem.create({
      data: {
        orderId: order2.id,
        productId: firstProduct.id,
        variantId: firstVariant.id,
        productName: firstProduct.name,
        productImage: `https://placehold.co/800x1000/0B1F3A/F7C8D0?text=${encodeURIComponent(firstProduct.name)}`,
        color: firstVariant.color,
        size: firstVariant.size,
        quantity: 2,
        price: firstProduct.salePrice || firstProduct.basePrice,
      }
    })
  }

  // Create site content
  const siteContents = [
    { key: 'about_us', value: 'StyleWithHer is India\'s premium couple fashion brand, dedicated to helping couples express their love through matching fashion. Founded in 2023, we believe that style is a beautiful way to celebrate togetherness. Every piece in our collection is crafted with love, using premium fabrics and modern designs that make couples look and feel their best.', type: 'text' },
    { key: 'contact_email', value: 'hello@stylewithher.com', type: 'text' },
    { key: 'contact_phone', value: '+91 98765 43210', type: 'text' },
    { key: 'contact_address', value: 'StyleWithHer Fashion Pvt. Ltd., 42 Fashion Street, Andheri West, Mumbai, Maharashtra 400053', type: 'text' },
    { key: 'social_instagram', value: 'https://instagram.com/stylewithher', type: 'text' },
    { key: 'social_facebook', value: 'https://facebook.com/stylewithher', type: 'text' },
    { key: 'social_twitter', value: 'https://twitter.com/stylewithher', type: 'text' },
    { key: 'shipping_policy', value: 'Free shipping on orders above Rs.999. Standard delivery takes 3-5 business days. Express delivery available for Rs.199 (1-2 business days).', type: 'text' },
    { key: 'return_policy', value: 'Easy returns within 15 days of delivery. Items must be unused with original tags. Refunds processed within 5-7 business days.', type: 'text' },
  ]
  for (const sc of siteContents) {
    await db.siteContent.upsert({
      where: { key: sc.key },
      update: { value: sc.value },
      create: sc,
    })
  }

  console.log('Database seeded successfully!')
  console.log('Admin credentials: admin@stylewithher.com / Admin@123')
  console.log('Demo user credentials: demo@stylewithher.com / User@123')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())