const { execSync } = require('child_process');

const BASE = 'http://127.0.0.1:3001';
const results = [];
let pass = 0, fail = 0;

function fetchJSON(method, path, body, token) {
  const headers = ['-H', 'Content-Type: application/json'];
  if (token) headers.push('-H', 'Authorization: Bearer ' + token);
  const dataFlag = body ? ['-d', JSON.stringify(body)] : [];
  const cmd = ['curl', '-s', '-w', '\\n%{http_code}', '-X', method, ...headers, ...dataFlag, BASE + path];
  try {
    const out = execSync(cmd.join(' '), { timeout: 15000 }).toString().trim();
    const lines = out.split('\n');
    const status = parseInt(lines[lines.length - 1]);
    const responseText = lines.slice(0, -1).join('\n');
    let data = null;
    try { data = JSON.parse(responseText); } catch(e) { data = responseText; }
    return { status, data, raw: responseText };
  } catch(e) {
    return { status: 0, data: null, error: e.message };
  }
}

function test(name, fn) {
  try {
    fn();
    pass++;
    results.push('✅ ' + name);
  } catch(e) {
    fail++;
    results.push('❌ ' + name + ': ' + e.message);
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

// ═══════════════════════════════════════════════
// 1. PUBLIC PAGES
// ═══════════════════════════════════════════════
test('GET / (Homepage loads)', () => {
  const r = fetchJSON('GET', '/');
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.raw.includes('StyleWithHer'), 'Missing brand');
});

test('GET /api/categories (8 categories)', () => {
  const r = fetchJSON('GET', '/api/categories');
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.categories && r.data.categories.length >= 8, 'Only ' + (r.data.categories?.length || 0));
});

test('GET /api/products (returns 20 products)', () => {
  const r = fetchJSON('GET', '/api/products');
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.products && r.data.products.length === 20, 'Expected 20, got ' + (r.data.products?.length || 0));
});

test('GET /api/products?gender=couple', () => {
  const r = fetchJSON('GET', '/api/products?gender=couple');
  assert(r.status === 200, 'Status ' + r.status);
  const bad = (r.data.products || []).filter(p => p.gender !== 'couple');
  assert(bad.length === 0, bad.length + ' non-couple items leaked');
});

test('GET /api/products?search=hoodie', () => {
  const r = fetchJSON('GET', '/api/products?search=hoodie');
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.products && r.data.products.length > 0, 'No search results');
});

// ═══════════════════════════════════════════════
// 2. AUTH
// ═══════════════════════════════════════════════
var adminToken = '';
var userToken = '';

test('POST /api/auth (Admin login)', () => {
  const r = fetchJSON('POST', '/api/auth', { action: 'login', email: 'admin@stylewithher.com', password: 'Admin@123' });
  assert(r.status === 200, 'Status ' + r.status + ': ' + JSON.stringify(r.data));
  assert(r.data.token, 'No token');
  assert(r.data.user.role === 'admin', 'Role: ' + r.data.user.role);
  adminToken = r.data.token;
});

test('POST /api/auth (User login)', () => {
  const r = fetchJSON('POST', '/api/auth', { action: 'login', email: 'demo@stylewithher.com', password: 'User@123' });
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.token, 'No token');
  userToken = r.data.token;
});

test('POST /api/auth (Signup)', () => {
  const r = fetchJSON('POST', '/api/auth', { action: 'signup', name: 'Test', email: 'test' + Date.now() + '@ex.com', password: 'Test@123' });
  assert(r.status === 200 || r.status === 201, 'Status ' + r.status + ': ' + JSON.stringify(r.data));
});

test('POST /api/auth (Wrong password → 401)', () => {
  const r = fetchJSON('POST', '/api/auth', { action: 'login', email: 'admin@stylewithher.com', password: 'wrong' });
  assert(r.status === 401, 'Expected 401, got ' + r.status);
});

test('POST /api/auth (Duplicate email → 409/400)', () => {
  const r = fetchJSON('POST', '/api/auth', { action: 'signup', name: 'Dup', email: 'admin@stylewithher.com', password: 'Test@123' });
  assert(r.status === 400 || r.status === 409, 'Expected 400/409, got ' + r.status);
});

// ═══════════════════════════════════════════════
// 3. PRODUCT DETAIL
// ═══════════════════════════════════════════════
var productId = '';

test('GET /api/products (extract first product ID)', () => {
  const r = fetchJSON('GET', '/api/products?limit=1');
  productId = r.data.products[0].id;
  assert(productId, 'No product ID');
});

test('GET /api/products/:id (Detail with variants+images)', () => {
  const r = fetchJSON('GET', '/api/products/' + productId);
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.product, 'No product');
  assert(r.data.product.variants && r.data.product.variants.length > 0, 'No variants');
  assert(r.data.product.images && r.data.product.images.length > 0, 'No images');
  assert(r.data.product.category, 'No category relation');
});

// ═══════════════════════════════════════════════
// 4. CART CRUD
// ═══════════════════════════════════════════════
test('POST /api/cart (Add item)', () => {
  const r = fetchJSON('POST', '/api/cart', { productId: productId, quantity: 2 }, userToken);
  assert(r.status === 200 || r.status === 201, 'Status ' + r.status + ': ' + JSON.stringify(r.data));
});

test('GET /api/cart (Cart has items)', () => {
  const r = fetchJSON('GET', '/api/cart', null, userToken);
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.items && r.data.items.length > 0, 'Cart empty');
  assert(r.data.items[0].quantity === 2, 'Qty not 2, got ' + r.data.items[0].quantity);
});

test('PUT /api/cart (Update qty to 3)', () => {
  const r = fetchJSON('PUT', '/api/cart', { productId: productId, quantity: 3 }, userToken);
  assert(r.status === 200, 'Status ' + r.status + ': ' + JSON.stringify(r.data));
});

test('DELETE /api/cart (Remove item)', () => {
  const r = fetchJSON('DELETE', '/api/cart', { productId: productId }, userToken);
  assert(r.status === 200, 'Status ' + r.status);
});

// ═══════════════════════════════════════════════
// 5. WISHLIST CRUD
// ═══════════════════════════════════════════════
test('POST /api/wishlist (Add)', () => {
  const r = fetchJSON('POST', '/api/wishlist', { productId: productId }, userToken);
  assert(r.status === 200 || r.status === 201, 'Status ' + r.status);
});

test('GET /api/wishlist (Has items)', () => {
  const r = fetchJSON('GET', '/api/wishlist', null, userToken);
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.items && r.data.items.length > 0, 'Wishlist empty');
});

test('DELETE /api/wishlist (Remove)', () => {
  const r = fetchJSON('DELETE', '/api/wishlist', { productId: productId }, userToken);
  assert(r.status === 200, 'Status ' + r.status);
});

// ═══════════════════════════════════════════════
// 6. REVIEWS
// ═══════════════════════════════════════════════
test('POST /api/reviews (Submit)', () => {
  const r = fetchJSON('POST', '/api/reviews', { productId: productId, rating: 5, title: 'Amazing!', comment: 'Love it!' }, userToken);
  assert(r.status === 200 || r.status === 201, 'Status ' + r.status + ': ' + JSON.stringify(r.data));
});

test('GET /api/products/:id (Review appears)', () => {
  const r = fetchJSON('GET', '/api/products/' + productId);
  assert(r.data.product.reviews && r.data.product.reviews.length > 0, 'No review in product');
  assert(r.data.product.reviews[0].rating === 5, 'Rating not 5');
});

// ═══════════════════════════════════════════════
// 7. COUPONS
// ═══════════════════════════════════════════════
test('GET /api/coupons (List)', () => {
  const r = fetchJSON('GET', '/api/coupons');
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.coupons && r.data.coupons.length > 0, 'No coupons');
});

test('POST /api/coupons/validate (WELCOME20)', () => {
  const r = fetchJSON('POST', '/api/coupons/validate', { code: 'WELCOME20', orderTotal: 2000 });
  assert(r.data.valid === true, 'Not valid');
  assert(r.data.discount > 0, 'No discount');
});

test('POST /api/coupons/validate (Fake code)', () => {
  const r = fetchJSON('POST', '/api/coupons/validate', { code: 'FAKE', orderTotal: 2000 });
  assert(r.data.valid === false, 'Should be invalid');
});

// ═══════════════════════════════════════════════
// 8. NEWSLETTER
// ═══════════════════════════════════════════════
test('POST /api/newsletter (Subscribe)', () => {
  const r = fetchJSON('POST', '/api/newsletter', { email: 'nl' + Date.now() + '@t.com' });
  assert(r.status === 200 || r.status === 201, 'Status ' + r.status);
});

// ═══════════════════════════════════════════════
// 9. ORDERS
// ═══════════════════════════════════════════════
test('POST /api/orders (Place order)', () => {
  // Add to cart first
  fetchJSON('POST', '/api/cart', { productId: productId, quantity: 1 }, userToken);
  const r = fetchJSON('POST', '/api/orders', {
    addressId: null,
    address: { fullName: 'Test', phone: '9999999999', addressLine1: '123 St', city: 'Mumbai', state: 'MH', pincode: '400001' },
    paymentMethod: 'cod'
  }, userToken);
  assert(r.status === 200 || r.status === 201, 'Status ' + r.status + ': ' + JSON.stringify(r.data));
});

test('GET /api/orders (List orders)', () => {
  const r = fetchJSON('GET', '/api/orders', null, userToken);
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.orders && r.data.orders.length > 0, 'No orders');
});

// ═══════════════════════════════════════════════
// 10. ADDRESSES
// ═══════════════════════════════════════════════
test('POST /api/addresses (Create)', () => {
  const r = fetchJSON('POST', '/api/addresses', { label: 'Home', fullName: 'Test', phone: '9999999999', addressLine1: '456 Lane', city: 'Delhi', state: 'DL', pincode: '110001' }, userToken);
  assert(r.status === 200 || r.status === 201, 'Status ' + r.status);
});

test('GET /api/addresses (List)', () => {
  const r = fetchJSON('GET', '/api/addresses', null, userToken);
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.addresses && r.data.addresses.length > 0, 'No addresses');
});

// ═══════════════════════════════════════════════
// 11. ADMIN - DASHBOARD
// ═══════════════════════════════════════════════
test('GET /api/admin (Stats)', () => {
  const r = fetchJSON('GET', '/api/admin', null, adminToken);
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.totalProducts !== undefined, 'Missing stats');
  assert(r.data.totalOrders !== undefined, 'Missing orders');
});

test('GET /api/admin (Non-admin → 403)', () => {
  const r = fetchJSON('GET', '/api/admin', null, userToken);
  assert(r.status === 403, 'Expected 403, got ' + r.status);
});

// ═══════════════════════════════════════════════
// 12. ADMIN - CUSTOMERS
// ═══════════════════════════════════════════════
test('GET /api/admin/customers', () => {
  const r = fetchJSON('GET', '/api/admin/customers', null, adminToken);
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.customers && r.data.customers.length > 0, 'No customers');
});

// ═══════════════════════════════════════════════
// 13. ADMIN - REVIEWS
// ═══════════════════════════════════════════════
test('GET /api/admin/reviews', () => {
  const r = fetchJSON('GET', '/api/admin/reviews', null, adminToken);
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.reviews !== undefined, 'No reviews data');
});

// ═══════════════════════════════════════════════
// 14. ADMIN - BANNERS
// ═══════════════════════════════════════════════
test('GET /api/admin/banners', () => {
  const r = fetchJSON('GET', '/api/admin/banners', null, adminToken);
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.banners !== undefined, 'No banners');
});

test('POST /api/admin/banners (Create)', () => {
  const r = fetchJSON('POST', '/api/admin/banners', { title: 'Test Banner', image: 'https://placehold.co/1200x400/0B1F3A/F7C8D0?text=Test', position: 'home', sortOrder: 99 }, adminToken);
  assert(r.status === 200 || r.status === 201, 'Status ' + r.status + ': ' + JSON.stringify(r.data));
});

// ═══════════════════════════════════════════════
// 15. ADMIN - CONTENT
// ═══════════════════════════════════════════════
test('GET /api/admin/content', () => {
  const r = fetchJSON('GET', '/api/admin/content', null, adminToken);
  assert(r.status === 200, 'Status ' + r.status);
  assert(r.data.content !== undefined, 'No content');
});

// ═══════════════════════════════════════════════
// 16. ADMIN - POSTS
// ═══════════════════════════════════════════════
test('GET /api/admin/posts', () => {
  const r = fetchJSON('GET', '/api/admin/posts', null, adminToken);
  assert(r.status === 200, 'Status ' + r.status);
});

test('POST /api/admin/posts (Create)', () => {
  const r = fetchJSON('POST', '/api/admin/posts', { title: 'Test Post', slug: 'tp-' + Date.now(), content: 'Test', status: 'draft' }, adminToken);
  assert(r.status === 200 || r.status === 201, 'Status ' + r.status + ': ' + JSON.stringify(r.data));
});

// ═══════════════════════════════════════════════
// 17. ADMIN - MEDIA
// ═══════════════════════════════════════════════
test('GET /api/admin/media', () => {
  const r = fetchJSON('GET', '/api/admin/media', null, adminToken);
  assert(r.status === 200, 'Status ' + r.status);
});

// ═══════════════════════════════════════════════
// 18. ADMIN - AUDIT LOGS
// ═══════════════════════════════════════════════
test('GET /api/admin/audit-logs', () => {
  const r = fetchJSON('GET', '/api/admin/audit-logs', null, adminToken);
  assert(r.status === 200, 'Status ' + r.status);
});

// ═══════════════════════════════════════════════
// 19. FILTERING & SORTING
// ═══════════════════════════════════════════════
test('GET /api/products?sort=price_asc', () => {
  const r = fetchJSON('GET', '/api/products?sort=price_asc&limit=5');
  assert(r.data.products.length >= 2, 'Not enough products');
  for (var i = 1; i < r.data.products.length; i++) {
    assert(r.data.products[i].salePrice >= r.data.products[i-1].salePrice, 'Not sorted asc');
  }
});

test('GET /api/products?sort=price_desc', () => {
  const r = fetchJSON('GET', '/api/products?sort=price_desc&limit=5');
  for (var i = 1; i < r.data.products.length; i++) {
    assert(r.data.products[i].salePrice <= r.data.products[i-1].salePrice, 'Not sorted desc');
  }
});

test('GET /api/products?filter=newArrival', () => {
  const r = fetchJSON('GET', '/api/products?filter=newArrival');
  assert(r.data.products.length > 0, 'No new arrivals');
  r.data.products.forEach(function(p) { assert(p.isNewArrival === true, p.name + ' not new arrival'); });
});

test('GET /api/products?filter=bestSeller', () => {
  const r = fetchJSON('GET', '/api/products?filter=bestSeller');
  assert(r.data.products.length > 0, 'No best sellers');
});

test('GET /api/products?gender=women', () => {
  const r = fetchJSON('GET', '/api/products?gender=women');
  assert(r.data.products.length > 0, 'No women products');
});

test('GET /api/products?gender=men', () => {
  const r = fetchJSON('GET', '/api/products?gender=men');
  assert(r.data.products.length > 0, 'No men products');
});

test('GET /api/products?categoryId filter', () => {
  var cr = fetchJSON('GET', '/api/categories');
  var catId = cr.data.categories[0].id;
  var r = fetchJSON('GET', '/api/products?categoryId=' + catId);
  assert(r.data.products.length > 0, 'No products in category ' + cr.data.categories[0].name);
});

test('GET /api/products?page=1&limit=5 (Pagination)', () => {
  const r = fetchJSON('GET', '/api/products?page=1&limit=5');
  assert(r.data.products.length <= 5, 'Expected max 5, got ' + r.data.products.length);
  assert(r.data.pagination && r.data.pagination.totalPages !== undefined, 'No pagination');
});

// ═══════════════════════════════════════════════
// 20. AUTH GUARDS
// ═══════════════════════════════════════════════
test('GET /api/cart (No auth → 401)', () => {
  const r = fetchJSON('GET', '/api/cart');
  assert(r.status === 401, 'Expected 401, got ' + r.status);
});

test('GET /api/orders (No auth → 401)', () => {
  const r = fetchJSON('GET', '/api/orders');
  assert(r.status === 401, 'Expected 401, got ' + r.status);
});

test('GET /api/wishlist (No auth → 401)', () => {
  const r = fetchJSON('GET', '/api/wishlist');
  assert(r.status === 401, 'Expected 401, got ' + r.status);
});

test('GET /api/admin (No auth → 401)', () => {
  const r = fetchJSON('GET', '/api/admin');
  assert(r.status === 401, 'Expected 401, got ' + r.status);
});

test('GET /api/admin/customers (No auth → 401)', () => {
  const r = fetchJSON('GET', '/api/admin/customers');
  assert(r.status === 401, 'Expected 401, got ' + r.status);
});

// ═══════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════╗');
console.log('║  STYLEWITHHER FULL FEATURE TEST RESULTS  ║');
console.log('╠══════════════════════════════════════════╣');
console.log('║  ' + String(pass).padEnd(10) + ' PASSED' + ' '.repeat(19) + '║');
if (fail > 0) console.log('║  ' + String(fail).padEnd(10) + ' FAILED' + ' '.repeat(19) + '║');
else console.log('║  ' + '0'.padEnd(10) + ' FAILED' + ' '.repeat(19) + '║');
console.log('║  TOTAL: ' + String(pass + fail).padEnd(6) + ' tests' + ' '.repeat(15) + '║');
console.log('╚══════════════════════════════════════════╝\n');
results.forEach(function(r) { console.log(r); });
if (fail > 0) process.exit(1);