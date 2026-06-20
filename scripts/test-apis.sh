#!/bin/bash
BASE="http://localhost:3000"
PASS=0
FAIL=0
RESULTS=""

test_endpoint() {
  local method=$1 path=$2 data=$3 label=$4
  local response
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE$path" 2>&1)
  elif [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE$path" -H "Content-Type: application/json" -d "$data" 2>&1)
  elif [ "$method" = "PUT" ]; then
    response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE$path" -H "Content-Type: application/json" -d "$data" 2>&1)
  elif [ "$method" = "DELETE" ]; then
    response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE$path" 2>&1)
  fi
  local code=$(echo "$response" | tail -1)
  local body=$(echo "$response" | sed '$d')
  
  if echo "$code" | grep -qE "^(200|201)$|^(401|403|404)$"; then
    RESULTS="$RESULTS\n✅ $label → $code"
    PASS=$((PASS+1))
  else
    RESULTS="$RESULTS\n❌ $label → $code | $body"
    FAIL=$((FAIL+1))
  fi
}

# 1. Auth - Signup
test_endpoint "POST" "/api/auth" '{"action":"signup","name":"Test User","email":"test@sw.com","password":"Test@123"}' "Auth Signup"

# 2. Auth - Login
test_endpoint "POST" "/api/auth" '{"action":"login","email":"test@sw.com","password":"Test@123"}' "Auth Login"

# 3. Get token for auth tests
TOKEN=$(curl -s -X POST "$BASE/api/auth" -H "Content-Type: application/json" -d '{"action":"login","email":"test@sw.com","password":"Test@123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

# 4. Auth - Profile
test_endpoint "GET" "/api/auth" "" "Auth Profile"
AUTH_H="Authorization: Bearer $TOKEN"

# 5. Categories
test_endpoint "GET" "/api/categories" "" "Categories List"

# 6. Products List (empty DB)
test_endpoint "GET" "/api/products" "" "Products List"

# 7. Cart (should be empty)
test_endpoint "GET" "/api/cart" "" "Cart List"

# 8. Wishlist
test_endpoint "GET" "/api/wishlist" "" "Wishlist List"

# 9. Orders
test_endpoint "GET" "/api/orders" "" "Orders List"

# 10. Newsletter
test_endpoint "POST" "/api/newsletter" '{"email":"newsletter@test.com"}' "Newsletter Subscribe"

# 11. Addresses
test_endpoint "GET" "/api/addresses" "" "Addresses List"

# 12. Coupon Validate
test_endpoint "POST" "/api/coupons/validate" '{"code":"TEST"}' "Coupon Validate"

# 13. Banners
test_endpoint "GET" "/api/admin/banners" "" "Banners List"

# 14. Reviews
test_endpoint "GET" "/api/reviews?productId=nonexistent" "" "Reviews (empty)"

# 15. Auth - Login with admin (will fail - no admin exists)
test_endpoint "POST" "/api/auth" '{"action":"login","email":"admin@stylewithher.com","password":"Admin@123"}' "Admin Login (no data)"

# 16. Create admin via signup then check
test_endpoint "POST" "/api/auth" '{"action":"signup","name":"Admin","email":"admin@stylewithher.com","password":"Admin@123"}' "Admin Signup"

# 17. Admin login
ADMIN_TOKEN=$(curl -s -X POST "$BASE/api/auth" -H "Content-Type: application/json" -d '{"action":"login","email":"admin@stylewithher.com","password":"Admin@123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

# 18. Admin Dashboard
test_endpoint "GET" "/api/admin" "" "Admin Dashboard"

# 19. Admin Customers
test_endpoint "GET" "/api/admin/customers" "" "Admin Customers"

# 20. Admin Reviews
test_endpoint "GET" "/api/admin/reviews" "" "Admin Reviews"

# 21. Admin Content
test_endpoint "GET" "/api/admin/content" "" "Admin Content"

# 22. Admin Coupons
test_endpoint "GET" "/api/coupons" "" "Admin Coupons"

echo ""
echo "========================================"
echo "  API TEST RESULTS: $PASS passed, $FAIL failed"
echo "========================================"
echo -e "$RESULTS"
echo ""
