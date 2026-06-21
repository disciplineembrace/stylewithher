#!/usr/bin/env python3
"""Apply i18n translations to all page components."""
import re

def add_import_if_missing(content, import_line):
    """Add import line after 'use client' if not already present."""
    if 'useTranslation' in content:
        return content
    # Find 'use client' line and add after the last import block
    # Insert before the first non-import statement
    lines = content.split('\n')
    insert_idx = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            insert_idx = i + 1
        elif line.strip() == '' and i > 0 and lines[i-1].strip().startswith('import '):
            insert_idx = i + 1
        elif insert_idx > 0 and not line.strip().startswith('import ') and line.strip() != '':
            break
    lines.insert(insert_idx, import_line)
    return '\n'.join(lines)

def apply_homepage(content):
    # Replace hero slides - move to component-level
    old_hero = """// ─── Hero Carousel Data ──────────────────────────────────────────────────────
const heroSlides = [
  {
    headline: 'Match Together,',
    subtitle: 'Love Together',
    description: 'Discover our curated collection of premium couple clothing designed to make every moment together special.',
    cta: 'Shop Couples Collection',
    gradient: 'from-[#0B1F3A] via-[#0B1F3A]/95 to-[#0B1F3A]/80',
    accent: '#F7C8D0',
    image: 'https://placehold.co/600x800/0B1F3A/F7C8D0?text=Her+%26+Him',
  },
  {
    headline: 'New Arrivals',
    subtitle: 'Spring 2025 Collection',
    description: 'Trendy matching sets that celebrate your unique bond. Premium fabrics, timeless designs.',
    cta: 'Explore New Arrivals',
    gradient: 'from-[#D96C8A] via-[#D96C8A]/90 to-[#F7C8D0]/80',
    accent: '#FFFFFF',
    image: 'https://placehold.co/600x800/D96C8A/FFFFFF?text=Spring+2025',
  },
  {
    headline: 'Premium Quality,',
    subtitle: 'Perfect Fit',
    description: 'Crafted with love for couples who appreciate the finest materials and impeccable style.',
    cta: 'Shop Best Sellers',
    gradient: 'from-[#F7C8D0] via-[#F7C8D0]/90 to-[#FFF5F7]/80',
    accent: '#0B1F3A',
    image: 'https://placehold.co/600x800/F7C8D0/0B1F3A?text=Premium+Style',
  },
]"""
    
    new_hero = """// ─── Hero Carousel Data (static visual, translated in component) ──────────────
const heroSlides = [
  {
    headlineKey: 'home.heroSlides.0.title',
    subtitleKey: 'home.heroSlides.0.subtitle',
    descriptionKey: 'home.heroSlides.0.subtitle',
    ctaKey: 'home.heroSlides.0.cta',
    gradient: 'from-[#0B1F3A] via-[#0B1F3A]/95 to-[#0B1F3A]/80',
    accent: '#F7C8D0',
    image: 'https://placehold.co/600x800/0B1F3A/F7C8D0?text=Her+%26+Him',
  },
  {
    headlineKey: 'home.heroSlides.1.title',
    subtitleKey: 'home.heroSlides.1.subtitle',
    descriptionKey: 'home.heroSlides.1.subtitle',
    ctaKey: 'home.heroSlides.1.cta',
    gradient: 'from-[#D96C8A] via-[#D96C8A]/90 to-[#F7C8D0]/80',
    accent: '#FFFFFF',
    image: 'https://placehold.co/600x800/D96C8A/FFFFFF?text=Spring+2025',
  },
  {
    headlineKey: 'home.heroSlides.3.title',
    subtitleKey: 'home.heroSlides.3.subtitle',
    descriptionKey: 'home.heroSlides.3.subtitle',
    ctaKey: 'home.heroSlides.3.cta',
    gradient: 'from-[#F7C8D0] via-[#F7C8D0]/90 to-[#FFF5F7]/80',
    accent: '#0B1F3A',
    image: 'https://placehold.co/600x800/F7C8D0/0B1F3A?text=Premium+Style',
  },
]"""

    content = content.replace(old_hero, new_hero)
    
    # Replace section headings in JSX
    replacements = [
        ("Shop by Category", "t('home.categories')"),
        ("Find your perfect couple style", "t('home.categoriesDesc')"),
        ("Featured Products", "t('home.featured')"),
        ("Hand-picked styles for you", "t('home.featuredDesc')"),
        ("Trending Now", "t('home.trending')"),
        ("What everyone is wearing", "t('home.trendingDesc')"),
        ("Just Dropped", "t('home.newArrivals')"),
        ("Fresh from our design studio", "t('home.newArrivalsDesc')"),
        ("Best Sellers", "t('home.bestSellers')"),
        ("Most loved by our customers", "t('home.bestSellersDesc')"),
        ('View All', "t('home.viewAll')"),
        ("What Our Customers Say", "t('home.testimonials')"),
        ("Real stories from real couples", "t('home.testimonialsDesc')"),
    ]
    
    for old, new in replacements:
        content = content.replace(f'>{old}<', f'>{{ {new} }}<')
        content = content.replace(f'>{old}"', f'>{{ {new} }}"')
    
    # Replace hero slide references in JSX: slide.headline -> t(slide.headlineKey)
    content = content.replace('slide.headline', 't(slide.headlineKey)')
    content = content.replace('slide.subtitle', 't(slide.subtitleKey)')
    content = content.replace('slide.description', 't(slide.descriptionKey)')
    content = content.replace('slide.cta', 't(slide.ctaKey)')
    
    # Replace testimonial references
    content = content.replace('testimonial.text', 't("home.testimonialItems." + String(idx) + ".text")')
    
    return content

def apply_product_listing(content):
    replacements = [
        ("'Latest'", "t('products.sortLatest')"),
        ("'Popularity'", "t('products.sortPopular')"),
        ("'Price: Low to High'", "t('products.sortPriceLow')"),
        ("'Price: High to Low'", "t('products.sortPriceHigh')"),
        ("'All Products'", "t('products.allProducts')"),
        ("'Filter By'", "t('products.filterBy')"),
        ("'Clear All'", "t('products.clearAll')"),
        ("'Price Range'", "t('products.priceRange')"),
        ("'Min'", "t('products.min')"),
        ("'Max'", "t('products.max')"),
        ("'Apply'", "t('products.apply')"),
        ("'Color'", "t('products.color')"),
        ("'Size'", "t('products.size')"),
        ("'Gender'", "t('products.gender')"),
        ("'Sort By'", "t('products.sort')"),
        ("'No products found matching your criteria'", "t('products.noProducts')"),
        ("'Try adjusting your filters'", "t('products.tryDifferent')"),
    ]
    for old, new in replacements:
        content = content.replace(old, new)
    return content

def apply_product_detail(content):
    replacements = [
        ("'Description'", "t('products.description')"),
        ("'Care Instructions'", "t('products.careInstructions')"),
        ("'Material'", "t('products.material')"),
        ("'Select Color'", "t('products.selectColor')"),
        ("'Select Size'", "t('products.selectSize')"),
        ("'Add to Cart'", "t('products.addToCart')"),
        ("'Buy Now'", "t('products.buyNow')"),
        ("'Reviews'", "t('products.reviews')"),
        ("'Write a Review'", "t('products.writeReview')"),
        ("'No reviews yet. Be the first to review!'", "t('products.noReviews')"),
        ("'In Stock'", "t('products.inStock')"),
        ("'Out of Stock'", "t('products.outOfStock')"),
        ("'sold'", "t('products.sold')"),
    ]
    for old, new in replacements:
        content = content.replace(f'>{old}<', f'>{{ {new} }}<')
    return content

def apply_cart(content):
    replacements = [
        ("'Your Cart'", "t('cart.yourCart')"),
        ("'Your cart is empty'", "t('cart.cartEmpty')"),
        ("'Looks like you haven't added anything yet. Start shopping to fill it up!'", "t('cart.cartEmptyDesc')"),
        ("'Start Shopping'", "t('cart.startShopping')"),
        ("'Continue Shopping'", "t('cart.continueShopping')"),
        ("'Proceed to Checkout'", "t('cart.checkout')"),
        ("'Order Summary'", "t('cart.orderSummary')"),
        ("'Subtotal'", "t('cart.subtotal')"),
        ("'Shipping'", "t('cart.shipping')"),
        ("'FREE'", "t('cart.freeShipping')"),
        ("'Discount'", "t('cart.discount')"),
        ("'Total'", "t('cart.total')"),
        ("'Coupon Code'", "t('cart.couponCode')"),
        ("'Apply'", "t('cart.applyCoupon')"),
        ("'Remove'", "t('cart.remove')"),
        ("'Move to Wishlist'", "t('cart.moveToWishlist')"),
        ("'items'", "t('cart.items')"),
    ]
    for old, new in replacements:
        content = content.replace(f'>{old}<', f'>{{ {new} }}<')
        content = content.replace(f'"{old}"', f'{{ {new} }}')
    # Handle qty label
    content = content.replace(">Qty<", ">{t('cart.quantity')}<")
    return content

def apply_wishlist(content):
    replacements = [
        ("'My Wishlist'", "t('wishlist.myWishlist')"),
        ("'Your wishlist is empty'", "t('wishlist.wishlistEmpty')"),
        ("'Save items you love for later. Click the heart icon on any product to add it here.'", "t('wishlist.wishlistEmptyDesc')"),
        ("'Browse Products'", "t('wishlist.browseProducts')"),
    ]
    for old, new in replacements:
        content = content.replace(f'>{old}<', f'>{{ {new} }}<')
    return content

def apply_checkout(content):
    replacements = [
        ("'Checkout'", "t('checkout.title')"),
        ("'Shipping Address'", "t('checkout.shippingAddress')"),
        ("'Add New Address'", "t('checkout.addNewAddress')"),
        ("'Select a shipping address'", "t('checkout.selectAddress')"),
        ("'Payment Method'", "t('checkout.paymentMethod')"),
        ("'Select a payment method'", "t('checkout.selectPayment')"),
        ("'Cash on Delivery'", "t('checkout.cod')"),
        ("'Razorpay'", "t('checkout.razorpay')"),
        ("'UPI'", "t('checkout.upi')"),
        ("'Credit/Debit Card'", "t('checkout.card')"),
        ("'Order Summary'", "t('checkout.orderSummary')"),
        ("'Place Order'", "t('checkout.placeOrder')"),
        ("'Order placed successfully!'", "t('checkout.orderPlaced')"),
        ("'Thank you for shopping with StyleWithHer'", "t('checkout.orderPlacedDesc')"),
        ("'Subtotal'", "t('cart.subtotal')"),
        ("'Shipping'", "t('cart.shipping')"),
        ("'FREE'", "t('cart.freeShipping')"),
        ("'Discount'", "t('cart.discount')"),
        ("'Total'", "t('cart.total')"),
    ]
    for old, new in replacements:
        content = content.replace(f'>{old}<', f'>{{ {new} }}<')
    return content

def apply_orders(content):
    replacements = [
        ("'My Orders'", "t('orders.myOrders')"),
        ("'No orders yet'", "t('orders.noOrders')"),
        ("'When you place your first order, it will appear here.'", "t('orders.noOrdersDesc')"),
        ("'Order Details'", "t('orders.orderDetails')"),
        ("'Order ID'", "t('orders.orderId')"),
        ("'Order Date'", "t('orders.orderDate')"),
        ("'Order Status'", "t('orders.orderStatus')"),
        ("'Payment Method'", "t('orders.paymentMethod')"),
        ("'Payment Status'", "t('orders.paymentStatus')"),
        ("'Shipping Address'", "t('orders.shippingAddress')"),
        ("'Order Items'", "t('orders.orderItems')"),
        ("'Subtotal'", "t('orders.subtotal')"),
        ("'Shipping'", "t('orders.shipping')"),
        ("'Discount'", "t('orders.discount')"),
        ("'Total'", "t('orders.total')"),
        ("'Back to Orders'", "t('orders.backToOrders')"),
    ]
    for old, new in replacements:
        content = content.replace(f'>{old}<', f'>{{ {new} }}<')
    
    # Replace status labels in the helper function
    content = content.replace(
        "pending: { label: 'Pending',",
        "pending: { label: t('orders.pending'),"
    )
    content = content.replace(
        "confirmed: { label: 'Confirmed',",
        "confirmed: { label: t('orders.confirmed'),"
    )
    content = content.replace(
        "processing: { label: 'Processing',",
        "processing: { label: t('orders.processing'),"
    )
    content = content.replace(
        "shipped: { label: 'Shipped',",
        "shipped: { label: t('orders.shipped'),"
    )
    content = content.replace(
        "delivered: { label: 'Delivered',",
        "delivered: { label: t('orders.delivered'),"
    )
    content = content.replace(
        "cancelled: { label: 'Cancelled',",
        "cancelled: { label: t('orders.cancelled'),"
    )
    
    # Payment method labels
    content = content.replace("'Cash on Delivery'", "t('checkout.cod')")
    content = content.replace("'Razorpay'", "t('checkout.razorpay')")
    content = content.replace("'UPI'", "t('checkout.upi')")
    content = content.replace("'Credit/Debit Card'", "t('checkout.card')")
    
    # Payment status labels
    content = content.replace("'Paid'", "t('orders.paid')")
    content = content.replace("'Unpaid'", "t('orders.unpaid')")
    content = content.replace("'Failed'", "t('orders.failed')")
    content = content.replace("'Refunded'", "t('orders.refunded')")
    
    # Tab filters
    content = content.replace("'All'", "t('orders.all')")
    
    return content

def apply_auth(content):
    replacements = [
        ("'Welcome Back'", "t('auth.welcomeBack')"),
        ("'Sign in to your account'", "t('auth.signIn')"),
        ("'Email'", "t('auth.email')"),
        ("'Password'", "t('auth.password')"),
        ("'Sign In'", "t('auth.loginButton')"),
        ("'Forgot password?'", "t('auth.forgotPassword')"),
        ("'Create Account'", "t('auth.createAccount')"),
        ("'Join the StyleWithHer family'", "t('auth.signUpDesc')"),
        ("'Full Name'", "t('auth.name')"),
        ("'Sign Up'", "t('auth.signUpButton')"),
        ("'Reset Password'", "t('auth.forgotTitle')"),
        ("'Enter your email and we\\'ll send you a reset link'", "t('auth.forgotDesc')"),
        ("'Send Reset Link'", "t('auth.sendResetLink')"),
        ("'Back to Login'", "t('auth.backToLogin')"),
        ("'My Profile'", "t('auth.profile')"),
        ("'Personal Information'", "t('auth.personalInfo')"),
        ("'Change Password'", "t('auth.changePassword')"),
        ("'Current Password'", "t('auth.oldPassword')"),
        ("'New Password'", "t('auth.newPassword')"),
        ("'Confirm Password'", "t('auth.confirmPassword')"),
        ("'Save Changes'", "t('auth.saveChanges')"),
        ("'Update Password'", "t('auth.updatePassword')"),
        ("'My Addresses'", "t('auth.addresses')"),
        ("'Add New Address'", "t('auth.addAddress')"),
        ("'Edit Address'", "t('auth.editAddress')"),
        ("'Address Label'", "t('auth.addressLabel')"),
        ("'Phone Number'", "t('auth.phone')"),
        ("'Address Line 1'", "t('auth.addressLine1')"),
        ("'Address Line 2 (Optional)'", "t('auth.addressLine2')"),
        ("'City'", "t('auth.city')"),
        ("'State'", "t('auth.state')"),
        ("'Pincode'", "t('auth.pincode')"),
        ("'Set as Default'", "t('auth.setDefault')"),
        ("'Save Address'", "t('auth.saveAddress')"),
    ]
    for old, new in replacements:
        content = content.replace(f'>{old}<', f'>{{ {new} }}<')
    return content

def apply_product_card(content):
    replacements = [
        ("'Add to Cart'", "t('products.addToCart')"),
        ("'NEW'", "t('common.new', 'NEW')"),
    ]
    for old, new in replacements:
        content = content.replace(f'>{old}<', f'>{{ {new} }}<')
    return content

# Process files
files_map = {
    '/home/z/my-project/src/components/home/HomePage.tsx': ('apply_homepage', True),
    '/home/z/my-project/src/components/products/ProductListing.tsx': ('apply_product_listing', True),
    '/home/z/my-project/src/components/products/ProductDetailPage.tsx': ('apply_product_detail', True),
    '/home/z/my-project/src/components/cart/CartPage.tsx': ('apply_cart', True),
    '/home/z/my-project/src/components/wishlist/WishlistPage.tsx': ('apply_wishlist', True),
    '/home/z/my-project/src/components/checkout/CheckoutPage.tsx': ('apply_checkout', True),
    '/home/z/my-project/src/components/orders/OrdersPage.tsx': ('apply_orders', True),
    '/home/z/my-project/src/components/auth/AuthPages.tsx': ('apply_auth', True),
    '/home/z/my-project/src/components/shared/ProductCard.tsx': ('apply_product_card', True),
}

functions = {
    'apply_homepage': apply_homepage,
    'apply_product_listing': apply_product_listing,
    'apply_product_detail': apply_product_detail,
    'apply_cart': apply_cart,
    'apply_wishlist': apply_wishlist,
    'apply_checkout': apply_checkout,
    'apply_orders': apply_orders,
    'apply_auth': apply_auth,
    'apply_product_card': apply_product_card,
}

for filepath, (func_name, add_import) in files_map.items():
    print(f"Processing {filepath}...")
    with open(filepath, 'r') as f:
        content = f.read()
    
    if add_import:
        content = add_import_if_missing(content, "import { useTranslation } from '@/i18n/use-language'")
    
    content = functions[func_name](content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"  Done: {filepath}")

print("\nAll files processed!")