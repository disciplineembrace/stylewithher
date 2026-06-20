const BASE = 'http://localhost:3000';

const results = [];
let pass = 0, fail = 0;

async function test(name, fn) {
  try {
    await fn();
    pass++;
    results.push(`✅ ${name}`);
  } catch (e) {
    fail++;
    results.push(`❌ ${name}: ${e.message}`);
  }
}

// 1. PUBLIC PAGES
await test('GET / (Homepage loads)', async () => {
  const r = await fetch(BASE);
  if (r.status !== 200) throw new Error(`Status ${r.status}`);
  const html = await r.text();
  if (!html.includes('StyleWithHer')) throw new Error('Missing brand name');
});

await test('GET /api/categories (8 categories)', async () => {
  const r = await fetch(`${BASE}/api/categories`);
  const d = await r.json();
  if (!d.categories || d.categories.length < 8) throw new Error(`Only ${d.categories?.length} categories`);
});

await test('GET /api/products (returns products)', async () => {
  const r = await fetch(`${BASE}/api/products`);
  const d = await r.json();
  if (!d.products || d.products.length === 0) throw new Error('No products returned');
});

await test('GET /api/products?gender=couple', async () => {
  const r = await fetch(`${BASE}/api/products?gender=couple`);
  const d = await r.json();
  if (!d.products) throw new Error('No products');
  const nonCouple = d.products.filter(p => p.gender !== 'couple');
  if (nonCouple.length > 0) throw new Error(`${nonCouple.length} non-couple products in filter`);
});

await test('GET /api/products?search=hoodie', async () => {
  const r = await fetch(`${BASE}/api/products?search=hoodie`);
  const d = await r.json();
  if (!d.products || d.products.length === 0) throw new Error('No search results');
});

// 2. AUTH
let adminToken = '';
let userToken = '';

await test('POST /api/auth (Admin login)', async () => {
  const r = await fetch(`${BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email: 'admin@stylewithher.com', password: 'Admin@123' })
  });
  const d = await r.json();
  if (!d.token) throw new Error('No token returned');
  adminToken = d.token;
  if (d.user.role !== 'admin') throw new Error(`Role is ${d.user.role}, expected admin`);
});

await test('POST /api/auth (User login)', async () => {
  const r = await fetch(`${BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email: 'demo@stylewithher.com', password: 'User@123' })
  });
  const d = await r.json();
  if (!d.token) throw new Error('No token returned');
  userToken = d.token;
  if (d.user.role !== 'customer') throw new Error(`Role is ${d.user.role}`);
});

await test('POST /api/auth (Signup new user)', async () => {
  const r = await fetch(`${BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'signup', name: 'Test User', email: `test${Date.now()}@example.com`, password: 'Test@123' })
  });
  const d = await r.json();
  if (r.status !== 201 && r.status !== 200) throw new Error(`Status ${r.status}: ${JSON.stringify(d)}`);
});

await test('POST /api/auth (Wrong password → 401)', async () => {
  const r = await fetch(`${BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email: 'admin@stylewithher.com', password: 'wrong' })
  });
  if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
});

// 3. PRODUCT DETAIL
let firstProductId = '';

await test('GET /api/products (get first product ID)', async () => {
  const r = await fetch(`${BASE}/api/products?limit=1`);
  const d = await r.json();
  firstProductId = d.products[0].id;
  if (!firstProductId) throw new Error('No product ID');
});

await test(`GET /api/products/${firstProductId} (Product detail)`, async () => {
  const r = await fetch(`${BASE}/api/products/${firstProductId}`);
  const d = await r.json();
  if (!d.product) throw new Error('No product in response');
  if (!d.product.variants || d.product.variants.length === 0) throw new Error('No variants');
  if (!d.product.images || d.product.images.length === 0) throw new Error('No images');
});

// 4. CART
await test('POST /api/cart (Add item)', async () => {
  const r = await fetch(`${BASE}/api/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ productId: firstProductId, quantity: 2 })
  });
  const d = await r.json();
  if (r.status !== 200 && r.status !== 201) throw new Error(`Status ${r.status}: ${JSON.stringify(d)}`);
});

await test('GET /api/cart (Get cart)', async () => {
  const r = await fetch(`${BASE}/api/cart`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  const d = await r.json();
  if (!d.items || d.items.length === 0) throw new Error('Cart is empty');
});

await test('PUT /api/cart (Update quantity)', async () => {
  const r = await fetch(`${BASE}/api/cart`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ productId: firstProductId, quantity: 3 })
  });
  const d = await r.json();
  if (r.status !== 200) throw new Error(`Status ${r.status}: ${JSON.stringify(d)}`);
});

await test('DELETE /api/cart (Remove item)', async () => {
  const r = await fetch(`${BASE}/api/cart`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ productId: firstProductId })
  });
  if (r.status !== 200) throw new Error(`Status ${r.status}`);
});

// 5. WISHLIST
await test('POST /api/wishlist (Add to wishlist)', async () => {
  const r = await fetch(`${BASE}/api/wishlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ productId: firstProductId })
  });
  if (r.status !== 200 && r.status !== 201) throw new Error(`Status ${r.status}`);
});

await test('GET /api/wishlist (Get wishlist)', async () => {
  const r = await fetch(`${BASE}/api/wishlist`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  const d = await r.json();
  if (!d.items || d.items.length === 0) throw new Error('Wishlist empty');
});

await test('DELETE /api/wishlist (Remove from wishlist)', async () => {
  const r = await fetch(`${BASE}/api/wishlist`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ productId: firstProductId })
  });
  if (r.status !== 200) throw new Error(`Status ${r.status}`);
});

// 6. REVIEWS
await test('POST /api/reviews (Submit review)', async () => {
  const r = await fetch(`${BASE}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ productId: firstProductId, rating: 5, title: 'Amazing!', comment: 'Love this product!' })
  });
  const d = await r.json();
  if (r.status !== 201 && r.status !== 200) throw new Error(`Status ${r.status}: ${JSON.stringify(d)}`);
});

await test('GET /api/products/:id (Review appears in product)', async () => {
  const r = await fetch(`${BASE}/api/products/${firstProductId}`);
  const d = await r.json();
  if (!d.product.reviews || d.product.reviews.length === 0) throw new Error('Review not found in product');
});

// 7. COUPONS
await test('GET /api/coupons (List coupons)', async () => {
  const r = await fetch(`${BASE}/api/coupons`);
  const d = await r.json();
  if (!d.coupons || d.coupons.length === 0) throw new Error('No coupons');
});

await test('POST /api/coupons/validate (WELCOME20)', async () => {
  const r = await fetch(`${BASE}/api/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'WELCOME20', orderTotal: 2000 })
  });
  const d = await r.json();
  if (!d.valid) throw new Error('Coupon not valid');
  if (d.discount <= 0) throw new Error(`Discount is ${d.discount}`);
});

await test('POST /api/coupons/validate (Invalid code)', async () => {
  const r = await fetch(`${BASE}/api/coupons/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'FAKECODE', orderTotal: 2000 })
  });
  const d = await r.json();
  if (d.valid) throw new Error('Fake code should not be valid');
});

// 8. NEWSLETTER
await test('POST /api/newsletter (Subscribe)', async () => {
  const r = await fetch(`${BASE}/api/newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `newsletter${Date.now()}@test.com` })
  });
  if (r.status !== 200 && r.status !== 201) throw new Error(`Status ${r.status}`);
});

// 9. ORDERS
let orderId = '';

await test('POST /api/orders (Place order)', async () => {
  // First add item to cart
  await fetch(`${BASE}/api/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ productId: firstProductId, quantity: 1 })
  });
  // Place order
  const r = await fetch(`${BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({
      addressId: null,
      address: { fullName: 'Test', phone: '9999999999', addressLine1: '123 Street', city: 'Mumbai', state: 'MH', pincode: '400001' },
      paymentMethod: 'cod'
    })
  });
  const d = await r.json();
  if (r.status !== 201 && r.status !== 200) throw new Error(`Status ${r.status}: ${JSON.stringify(d)}`);
  orderId = d.order?.id || d.id;
});

await test('GET /api/orders (List orders)', async () => {
  const r = await fetch(`${BASE}/api/orders`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  const d = await r.json();
  if (!d.orders || d.orders.length === 0) throw new Error('No orders');
});

// 10. ADDRESSES
await test('POST /api/addresses (Create address)', async () => {
  const r = await fetch(`${BASE}/api/addresses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ label: 'Home', fullName: 'Test', phone: '9999999999', addressLine1: '456 Lane', city: 'Delhi', state: 'DL', pincode: '110001' })
  });
  if (r.status !== 200 && r.status !== 201) throw new Error(`Status ${r.status}`);
});

await test('GET /api/addresses (List addresses)', async () => {
  const r = await fetch(`${BASE}/api/addresses`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  const d = await r.json();
  if (!d.addresses || d.addresses.length === 0) throw new Error('No addresses');
});

// 11. ADMIN APIs
await test('GET /api/admin (Dashboard stats)', async () => {
  const r = await fetch(`${BASE}/api/admin`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (r.status !== 200) throw new Error(`Status ${r.status}`);
  const d = await r.json();
  if (d.totalProducts === undefined) throw new Error('Missing stats');
});

await test('GET /api/admin (Non-admin → 403)', async () => {
  const r = await fetch(`${BASE}/api/admin`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  if (r.status !== 403) throw new Error(`Expected 403, got ${r.status}`);
});

await test('GET /api/admin/customers (Customer list)', async () => {
  const r = await fetch(`${BASE}/api/admin/customers`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const d = await r.json();
  if (!d.customers || d.customers.length === 0) throw new Error('No customers');
});

await test('GET /api/admin/reviews (Review list)', async () => {
  const r = await fetch(`${BASE}/api/admin/reviews`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const d = await r.json();
  if (!d.reviews) throw new Error('No reviews data');
});

await test('GET /api/admin/banners (Banner list)', async () => {
  const r = await fetch(`${BASE}/api/admin/banners`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const d = await r.json();
  if (!d.banners) throw new Error('No banners');
});

await test('GET /api/admin/content (Site content)', async () => {
  const r = await fetch(`${BASE}/api/admin/content`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const d = await r.json();
  if (!d.content) throw new Error('No content');
});

await test('GET /api/admin/posts (Posts list)', async () => {
  const r = await fetch(`${BASE}/api/admin/posts`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (r.status !== 200) throw new Error(`Status ${r.status}`);
});

await test('GET /api/admin/media (Media list)', async () => {
  const r = await fetch(`${BASE}/api/admin/media`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (r.status !== 200) throw new Error(`Status ${r.status}`);
});

await test('GET /api/admin/audit-logs (Audit logs)', async () => {
  const r = await fetch(`${BASE}/api/admin/audit-logs`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (r.status !== 200) throw new Error(`Status ${r.status}`);
});

// 12. ADMIN CREATE/UPDATE OPERATIONS
await test('POST /api/admin/banners (Create banner)', async () => {
  const r = await fetch(`${BASE}/api/admin/banners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ title: 'Test Banner', image: 'https://placehold.co/1200x400/0B1F3A/F7C8D0?text=Test+Banner', position: 'home', sortOrder: 99 })
  });
  if (r.status !== 200 && r.status !== 201) throw new Error(`Status ${r.status}`);
});

await test('POST /api/admin/posts (Create post)', async () => {
  const r = await fetch(`${BASE}/api/admin/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ title: 'Test Post', slug: `test-post-${Date.now()}`, content: 'Test content', status: 'draft' })
  });
  if (r.status !== 200 && r.status !== 201) throw new Error(`Status ${r.status}`);
});

// 13. PRODUCT FILTERING & SORTING
await test('GET /api/products?sort=price_asc', async () => {
  const r = await fetch(`${BASE}/api/products?sort=price_asc&limit=3`);
  const d = await r.json();
  if (d.products.length < 2) throw new Error('Not enough products to sort');
  for (let i = 1; i < d.products.length; i++) {
    if (d.products[i].salePrice < d.products[i-1].salePrice) throw new Error('Not sorted ascending');
  }
});

await test('GET /api/products?filter=newArrival', async () => {
  const r = await fetch(`${BASE}/api/products?filter=newArrival`);
  const d = await r.json();
  if (d.products.length === 0) throw new Error('No new arrivals');
  const hasNonNew = d.products.find(p => !p.isNewArrival);
  if (hasNonNew) throw new Error('Non-new-arrival in filter');
});

await test('GET /api/products?filter=bestSeller', async () => {
  const r = await fetch(`${BASE}/api/products?filter=bestSeller`);
  const d = await r.json();
  if (d.products.length === 0) throw new Error('No best sellers');
});

await test('GET /api/products?gender=women', async () => {
  const r = await fetch(`${BASE}/api/products?gender=women`);
  const d = await r.json();
  if (d.products.length === 0) throw new Error('No women products');
});

// 14. PRODUCT CATEGORIES FILTER
await test('GET /api/products?categoryId (filter by category)', async () => {
  const cats = await fetch(`${BASE}/api/categories`).then(r => r.json());
  const catId = cats.categories[0].id;
  const r = await fetch(`${BASE}/api/products?categoryId=${catId}`);
  const d = await r.json();
  if (d.products.length === 0) throw new Error('No products in category');
});

// 15. PAGINATION
await test('GET /api/products?page=1&limit=5 (Pagination)', async () => {
  const r = await fetch(`${BASE}/api/products?page=1&limit=5`);
  const d = await r.json();
  if (d.products.length > 5) throw new Error(`Expected max 5, got ${d.products.length}`);
  if (d.pagination.totalPages === undefined) throw new Error('No pagination info');
});

// 16. UNAUTHENTICATED ACCESS GUARDS
await test('GET /api/cart (No auth → 401)', async () => {
  const r = await fetch(`${BASE}/api/cart`);
  if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
});

await test('GET /api/orders (No auth → 401)', async () => {
  const r = await fetch(`${BASE}/api/orders`);
  if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
});

await test('GET /api/wishlist (No auth → 401)', async () => {
  const r = await fetch(`${BASE}/api/wishlist`);
  if (r.status !== 401) throw new Error(`Expected 401, got ${r.status}`);
});

// SUMMARY
console.log('\n═══════════════════════════════════════════');
console.log(`  TEST RESULTS: ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════════════════\n');
results.forEach(r => console.log(r));
if (fail > 0) process.exit(1);