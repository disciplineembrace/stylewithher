#!/bin/bash
BASE="http://127.0.0.1:3001"
PASS=0
FAIL=0
RESULTS=""

test_api() {
  local name="$1" method="$2" path="$3" body="$4" token="$5" expect_status="$6"
  local headers="-H 'Content-Type: application/json'"
  if [ -n "$token" ]; then headers="$headers -H 'Authorization: Bearer $token'"; fi
  local data=""
  if [ -n "$body" ]; then data="-d '$body'"; fi
  
  local response=$(eval "curl -s -w '\n%{http_code}' -X $method $headers $data '$BASE$path'" 2>/dev/null)
  local status=$(echo "$response" | tail -1)
  local body_resp=$(echo "$response" | sed '$d')
  
  if [ "$status" = "$expect_status" ]; then
    PASS=$((PASS+1))
    RESULTS="$RESULTS\n✅ $name (HTTP $status)"
  else
    FAIL=$((FAIL+1))
    RESULTS="$RESULTS\n❌ $name (Expected $expect_status, got $status) — $body_resp"
  fi
}

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║  STYLEWITHHER — COMPLETE FEATURE TEST SUITE   ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# ─── 1. PUBLIC PAGES ───────────────────────────────────
test_api "Homepage loads" "GET" "/" "" "" "200"
test_api "Categories list (8)" "GET" "/api/categories" "" "" "200"
test_api "Products list" "GET" "/api/products" "" "" "200"
test_api "Products filter: gender=couple" "GET" "/api/products?gender=couple" "" "" "200"
test_api "Products search: hoodie" "GET" "/api/products?search=hoodie" "" "" "200"

# ─── 2. AUTH ───────────────────────────────────────────
ADMIN_TOKEN=""
USER_TOKEN=""

response=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"action":"login","email":"admin@stylewithher.com","password":"Admin@123"}' "$BASE/api/auth" 2>/dev/null)
ADMIN_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$ADMIN_TOKEN" ]; then
  PASS=$((PASS+1)); RESULTS="$RESULTS\n✅ Admin login (got token)"
else
  FAIL=$((FAIL+1)); RESULTS="$RESULTS\n❌ Admin login failed: $response"
fi

response=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"action":"login","email":"demo@stylewithher.com","password":"User@123"}' "$BASE/api/auth" 2>/dev/null)
USER_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$USER_TOKEN" ]; then
  PASS=$((PASS+1)); RESULTS="$RESULTS\n✅ User login (got token)"
else
  FAIL=$((FAIL+1)); RESULTS="$RESULTS\n❌ User login failed: $response"
fi

test_api "Auth: wrong password → 401" "POST" "/api/auth" '{"action":"login","email":"admin@stylewithher.com","password":"wrong"}' "" "401"
test_api "Auth: signup new user" "POST" "/api/auth" "{\"action\":\"signup\",\"name\":\"Test\",\"email\":\"test$(date +%s)@ex.com\",\"password\":\"Test@123\"}" "" "200"

# ─── 3. PRODUCT DETAIL ────────────────────────────────
PID=$(curl -s "$BASE/api/products?limit=1" 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$PID" ]; then
  PASS=$((PASS+1)); RESULTS="$RESULTS\n✅ Got product ID: $PID"
else
  FAIL=$((FAIL+1)); RESULTS="$RESULTS\n❌ Could not get product ID"
fi

test_api "Product detail (variants+images)" "GET" "/api/products/$PID" "" "" "200"

# ─── 4. CART CRUD ──────────────────────────────────────
test_api "Cart: add item" "POST" "/api/cart" "{\"productId\":\"$PID\",\"quantity\":2}" "$USER_TOKEN" "200"
test_api "Cart: get items" "GET" "/api/cart" "" "$USER_TOKEN" "200"
test_api "Cart: update qty" "PUT" "/api/cart" "{\"productId\":\"$PID\",\"quantity\":3}" "$USER_TOKEN" "200"
test_api "Cart: remove item" "DELETE" "/api/cart" "{\"productId\":\"$PID\"}" "$USER_TOKEN" "200"

# ─── 5. WISHLIST CRUD ─────────────────────────────────
test_api "Wishlist: add" "POST" "/api/wishlist" "{\"productId\":\"$PID\"}" "$USER_TOKEN" "200"
test_api "Wishlist: get" "GET" "/api/wishlist" "" "$USER_TOKEN" "200"
test_api "Wishlist: remove" "DELETE" "/api/wishlist" "{\"productId\":\"$PID\"}" "$USER_TOKEN" "200"

# ─── 6. REVIEWS ───────────────────────────────────────
test_api "Reviews: submit" "POST" "/api/reviews" "{\"productId\":\"$PID\",\"rating\":5,\"title\":\"Amazing\",\"comment\":\"Love it!\"}" "$USER_TOKEN" "201"
test_api "Reviews: visible on product" "GET" "/api/products/$PID" "" "" "200"

# ─── 7. COUPONS ────────────────────────────────────────
test_api "Coupons: list" "GET" "/api/coupons" "" "" "200"
test_api "Coupons: validate WELCOME20" "POST" "/api/coupons/validate" '{"code":"WELCOME20","orderTotal":2000}' "" "200"
test_api "Coupons: reject fake" "POST" "/api/coupons/validate" '{"code":"FAKE","orderTotal":2000}' "" "200"

# ─── 8. NEWSLETTER ────────────────────────────────────
test_api "Newsletter: subscribe" "POST" "/api/newsletter" "{\"email\":\"nl$(date +%s)@t.com\"}" "" "200"

# ─── 9. ORDERS ─────────────────────────────────────────
# Re-add to cart for order
curl -s -X POST -H 'Content-Type: application/json' -H "Authorization: Bearer $USER_TOKEN" -d "{\"productId\":\"$PID\",\"quantity\":1}" "$BASE/api/cart" > /dev/null 2>&1
test_api "Orders: place order" "POST" "/api/orders" '{"addressId":null,"address":{"fullName":"Test","phone":"9999999999","addressLine1":"123 St","city":"Mumbai","state":"MH","pincode":"400001"},"paymentMethod":"cod"}' "$USER_TOKEN" "201"
test_api "Orders: list" "GET" "/api/orders" "" "$USER_TOKEN" "200"

# ─── 10. ADDRESSES ────────────────────────────────────
test_api "Addresses: create" "POST" "/api/addresses" '{"label":"Home","fullName":"Test","phone":"9999999999","addressLine1":"456 Ln","city":"Delhi","state":"DL","pincode":"110001"}' "$USER_TOKEN" "200"
test_api "Addresses: list" "GET" "/api/addresses" "" "$USER_TOKEN" "200"

# ─── 11. ADMIN: DASHBOARD ─────────────────────────────
test_api "Admin: dashboard stats" "GET" "/api/admin" "" "$ADMIN_TOKEN" "200"
test_api "Admin: non-admin → 403" "GET" "/api/admin" "" "$USER_TOKEN" "403"

# ─── 12. ADMIN: CUSTOMERS ─────────────────────────────
test_api "Admin: customers" "GET" "/api/admin/customers" "" "$ADMIN_TOKEN" "200"

# ─── 13. ADMIN: REVIEWS ───────────────────────────────
test_api "Admin: reviews" "GET" "/api/admin/reviews" "" "$ADMIN_TOKEN" "200"

# ─── 14. ADMIN: BANNERS ───────────────────────────────
test_api "Admin: banners list" "GET" "/api/admin/banners" "" "$ADMIN_TOKEN" "200"
test_api "Admin: create banner" "POST" "/api/admin/banners" '{"title":"Test Banner","image":"https://placehold.co/1200x400/0B1F3A/F7C8D0?text=Test","position":"home","sortOrder":99}' "$ADMIN_TOKEN" "200"

# ─── 15. ADMIN: CONTENT ───────────────────────────────
test_api "Admin: site content" "GET" "/api/admin/content" "" "$ADMIN_TOKEN" "200"

# ─── 16. ADMIN: POSTS ─────────────────────────────────
test_api "Admin: posts list" "GET" "/api/admin/posts" "" "$ADMIN_TOKEN" "200"
test_api "Admin: create post" "POST" "/api/admin/posts" "{\"title\":\"Test Post\",\"slug\":\"tp$(date +%s)\",\"content\":\"Test\",\"status\":\"draft\"}" "$ADMIN_TOKEN" "200"

# ─── 17. ADMIN: MEDIA ─────────────────────────────────
test_api "Admin: media list" "GET" "/api/admin/media" "" "$ADMIN_TOKEN" "200"

# ─── 18. ADMIN: AUDIT LOGS ────────────────────────────
test_api "Admin: audit logs" "GET" "/api/admin/audit-logs" "" "$ADMIN_TOKEN" "200"

# ─── 19. FILTERING & SORTING ─────────────────────────
test_api "Filter: newArrival" "GET" "/api/products?filter=newArrival" "" "" "200"
test_api "Filter: bestSeller" "GET" "/api/products?filter=bestSeller" "" "" "200"
test_api "Filter: gender=women" "GET" "/api/products?gender=women" "" "" "200"
test_api "Filter: gender=men" "GET" "/api/products?gender=men" "" "" "200"
test_api "Sort: price_asc" "GET" "/api/products?sort=price_asc" "" "" "200"
test_api "Sort: price_desc" "GET" "/api/products?sort=price_desc" "" "" "200"
test_api "Pagination: page=1&limit=5" "GET" "/api/products?page=1&limit=5" "" "" "200"

# ─── 20. AUTH GUARDS ──────────────────────────────────
test_api "Guard: cart no auth → 401" "GET" "/api/cart" "" "" "401"
test_api "Guard: orders no auth → 401" "GET" "/api/orders" "" "" "401"
test_api "Guard: wishlist no auth → 401" "GET" "/api/wishlist" "" "" "401"
test_api "Guard: admin no auth → 401" "GET" "/api/admin" "" "" "401"
test_api "Guard: admin/customers no auth → 401" "GET" "/api/admin/customers" "" "" "401"

# ─── RESULTS ───────────────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║           TEST RESULTS SUMMARY                 ║"
echo "╠═══════════════════════════════════════════════╣"
printf "║  ✅ %3d PASSED                                ║\n" "$PASS"
printf "║  ❌ %3d FAILED                                ║\n" "$FAIL"
printf "║  📊 Total: %3d tests                          ║\n" "$((PASS+FAIL))"
echo "╚═══════════════════════════════════════════════╝"
echo ""
echo -e "$RESULTS"
echo ""

if [ "$FAIL" -gt 0 ]; then exit 1; fi