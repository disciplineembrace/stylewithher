#!/bin/bash
BASE="http://127.0.0.1:3000"
P=0; F=0

r() {
  local n="$1" e="$2" s
  s=$(curl -s -o /dev/null -w "%{http_code}" -X "$3" ${4:+-H "Content-Type: application/json"} ${5:+-H "Authorization: Bearer $5"} ${6:+-d "$6"} "$BASE$7" 2>/dev/null)
  if [ "$s" = "$e" ]; then P=$((P+1)); echo "✅ $n ($s)"; else F=$((F+1)); echo "❌ $n (exp $e got $s)"; fi
}

# Get tokens & product ID (one at a time to avoid pool exhaustion)
AT=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"action":"login","email":"admin@stylewithher.com","password":"Admin@123"}' "$BASE/api/auth" 2>/dev/null | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
sleep 0.5
UT=$(curl -s -X POST -H 'Content-Type: application/json' -d '{"action":"login","email":"demo@stylewithher.com","password":"User@123"}' "$BASE/api/auth" 2>/dev/null | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
sleep 0.5
PID=$(curl -s "$BASE/api/products?limit=1" 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
sleep 0.5
echo "🔑 Admin=${AT:+✅} User=${UT:+✅} PID=${PID:0:10}"
echo ""

echo "── 1. PUBLIC PAGES ──────────────────"
r "Homepage" 200 GET "" "" "" "/"
sleep 0.4
r "Categories" 200 GET "" "" "" "/api/categories"
sleep 0.4
r "Products" 200 GET "" "" "" "/api/products"
sleep 0.4
r "Couple" 200 GET "" "" "" "/api/products?gender=couple"
sleep 0.4
r "Search" 200 GET "" "" "" "/api/products?search=hoodie"
sleep 0.4
r "NewArrival" 200 GET "" "" "" "/api/products?filter=newArrival"
sleep 0.4
r "BestSeller" 200 GET "" "" "" "/api/products?filter=bestSeller"
sleep 0.4
r "Women" 200 GET "" "" "" "/api/products?gender=women"
sleep 0.4
r "Men" 200 GET "" "" "" "/api/products?gender=men"
sleep 0.4
r "SortAsc" 200 GET "" "" "" "/api/products?sort=price_asc"
sleep 0.4
r "SortDesc" 200 GET "" "" "" "/api/products?sort=price_desc"
sleep 0.4
r "Pagination" 200 GET "" "" "" "/api/products?page=1&limit=5"
sleep 0.5

echo ""
echo "── 2. AUTH ──────────────────────────"
[ -n "$AT" ] && { P=$((P+1)); echo "✅ Admin login"; } || { F=$((F+1)); echo "❌ Admin login"; }
[ -n "$UT" ] && { P=$((P+1)); echo "✅ User login"; } || { F=$((F+1)); echo "❌ User login"; }
sleep 0.5
r "WrongPwd→401" 401 POST "yes" "" "" "/api/auth" '{"action":"login","email":"admin@stylewithher.com","password":"x"}'
sleep 0.5
r "Signup" 200 POST "yes" "" "" "/api/auth" "{\"action\":\"signup\",\"name\":\"T\",\"email\":\"t$(date +%s)@e.com\",\"password\":\"Test@123\"}"
sleep 0.5

echo ""
echo "── 3. PRODUCT ──────────────────────"
[ -n "$PID" ] && { P=$((P+1)); echo "✅ Got PID"; } || { F=$((F+1)); echo "❌ No PID"; }
r "Detail" 200 GET "" "" "" "/api/products/$PID"
sleep 0.5

echo ""
echo "── 4. CART ─────────────────────────"
r "Add" 201 POST "yes" "$UT" "{\"productId\":\"$PID\",\"quantity\":2}" "/api/cart"
sleep 0.5
r "Get" 200 GET "" "$UT" "" "/api/cart"
sleep 0.5
r "Update" 200 PUT "yes" "$UT" "{\"productId\":\"$PID\",\"quantity\":3}" "/api/cart"
sleep 0.5
r "Remove" 200 DELETE "yes" "$UT" "{\"productId\":\"$PID\"}" "/api/cart"
sleep 0.5

echo ""
echo "── 5. WISHLIST ─────────────────────"
r "Add" 201 POST "yes" "$UT" "{\"productId\":\"$PID\"}" "/api/wishlist"
sleep 0.5
r "Get" 200 GET "" "$UT" "" "/api/wishlist"
sleep 0.5
r "Remove" 200 DELETE "yes" "$UT" "{\"productId\":\"$PID\"}" "/api/wishlist"
sleep 0.5

echo ""
echo "── 6. REVIEWS ──────────────────────"
r "Visible" 200 GET "" "" "" "/api/products/$PID"
sleep 0.5

echo ""
echo "── 7. COUPONS ──────────────────────"
r "List" 200 GET "" "" "" "/api/coupons"
sleep 0.5
r "WELCOME20" 200 POST "yes" "" "" "/api/coupons/validate" '{"code":"WELCOME20","orderTotal":2000}'
sleep 0.5
r "Fake" 200 POST "yes" "" "" "/api/coupons/validate" '{"code":"FAKE","orderTotal":2000}'
sleep 0.5

echo ""
echo "── 8. NEWSLETTER ───────────────────"
r "Subscribe" 200 POST "yes" "" "" "/api/newsletter" "{\"email\":\"nl$(date +%s)@t.com\"}"
sleep 0.5

echo ""
echo "── 9. ORDERS ───────────────────────"
curl -s -X POST -H 'Content-Type: application/json' -H "Authorization: Bearer $UT" -d "{\"productId\":\"$PID\",\"quantity\":1}" "$BASE/api/cart" >/dev/null 2>&1
sleep 0.5
r "Place" 201 POST "yes" "$UT" '{"addressId":null,"address":{"fullName":"T","phone":"9999999999","addressLine1":"123","city":"Mumbai","state":"MH","pincode":"400001"},"paymentMethod":"cod"}' "/api/orders"
sleep 0.5
r "List" 200 GET "" "$UT" "" "/api/orders"
sleep 0.5

echo ""
echo "── 10. ADDRESSES ───────────────────"
r "Create" 201 POST "yes" "$UT" '{"label":"Home","fullName":"T","phone":"9999999999","addressLine1":"456","city":"Delhi","state":"DL","pincode":"110001"}' "/api/addresses"
sleep 0.5
r "List" 200 GET "" "$UT" "" "/api/addresses"
sleep 0.5

echo ""
echo "── 11. ADMIN ───────────────────────"
r "Dash" 200 GET "" "$AT" "" "/api/admin"
sleep 0.5
r "403" 403 GET "" "$UT" "" "/api/admin"
sleep 0.5
r "Customers" 200 GET "" "$AT" "" "/api/admin/customers"
sleep 0.5
r "Reviews" 200 GET "" "$AT" "" "/api/admin/reviews"
sleep 0.5
r "Banners" 200 GET "" "$AT" "" "/api/admin/banners"
sleep 0.5
r "AddBanner" 201 POST "yes" "$AT" '{"title":"TB","image":"https://placehold.co/1200x400/0B1F3A/F7C8D0?text=T","position":"home","sortOrder":99}' "/api/admin/banners"
sleep 0.5
r "Content" 200 GET "" "$AT" "" "/api/admin/content"
sleep 0.5
r "Posts" 200 GET "" "$AT" "" "/api/admin/posts"
sleep 0.5
r "AddPost" 201 POST "yes" "$AT" "{\"title\":\"TP\",\"slug\":\"tp$(date +%s)\",\"content\":\"c\",\"status\":\"draft\"}" "/api/admin/posts"
sleep 0.5
r "Media" 200 GET "" "$AT" "" "/api/admin/media"
sleep 0.5
r "Audit" 200 GET "" "$AT" "" "/api/admin/audit-logs"
sleep 0.5

echo ""
echo "── 12. AUTH GUARDS ─────────────────"
r "cart" 401 GET "" "" "" "/api/cart"
sleep 0.4
r "orders" 401 GET "" "" "" "/api/orders"
sleep 0.4
r "wish" 401 GET "" "" "" "/api/wishlist"
sleep 0.4
r "admin" 401 GET "" "" "" "/api/admin"
sleep 0.4
r "acust" 401 GET "" "" "" "/api/admin/customers"
sleep 0.4

echo ""
echo "════════════════════════════════════════"
echo "  ✅ $P PASSED  |  ❌ $F FAILED  |  📊 $((P+F)) TOTAL"
echo "════════════════════════════════════════"
[ "$F" -eq 0 ] && echo "  🎉 ALL TESTS PASSED!" || echo "  ⚠️  $F test(s) need attention"