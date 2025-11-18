# Fix Cart Items Not Saving to Database

## Problem
- Backend logs show `items = 0` for all carts
- POST /cart/add seems successful but items not persisted
- chitietdonhang table is empty

## Possible Causes

### 1. RLS (Row Level Security) Blocking Inserts
Supabase RLS policies might be preventing service role from inserting.

**Check**: Run in Supabase SQL Editor:
```sql
SELECT * FROM pg_policies WHERE tablename = 'chitietdonhang';
```

**Fix**: Disable RLS or add policy:
```sql
-- Option 1: Disable RLS (not recommended for production)
ALTER TABLE chitietdonhang DISABLE ROW LEVEL SECURITY;

-- Option 2: Add policy for service role
CREATE POLICY "Allow service role all" ON chitietdonhang
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### 2. Foreign Key Constraint Failure
`machitietsanpham` might not exist in `chitietsanpham` table.

**Check**:
```sql
SELECT * FROM chitietsanpham WHERE machitietsanpham = 45;
```

**Fix**: Make sure variant ID is valid.

### 3. Server Using Wrong Supabase Client
Backend might be using anon key instead of service role key.

**Check** in `config/db.js`:
```javascript
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Must be service role key!
);
```

**Not**:
```javascript
process.env.SUPABASE_ANON_KEY  // Wrong! Anon key has restrictions
```

### 4. Transaction Rollback
Error happening after insert that causes rollback.

**Check**: Look for errors in server logs after "Inserting new item".

## Debug Steps

### Step 1: Check Server Logs
```bash
cd d:\shopthoitrang\shopthoitrang-server
npm start
```

When you tap "THÊM VÀO GIỎ", you should see:
```
[POST /cart/add] userId= 11 variantId= 45 qty= 1 price= 595000
[POST /cart/add] Inserting new item: { madonhang: 60, machitietsanpham: 45, soluong: 1, dongia: 595000 }
[POST /cart/add] Inserted successfully: { machitietdonhang: 123, ... }
```

If you see error instead:
```
[POST /cart/add] Insert error: { code: 'PGRST...' }
```

That's the root cause!

### Step 2: Check Supabase Dashboard

1. Go to Supabase Dashboard
2. Table Editor → chitietdonhang
3. Check if any rows exist
4. Try manual insert through dashboard

### Step 3: Check RLS Policies

1. Go to Authentication → Policies
2. Look at chitietdonhang table
3. Make sure service role can INSERT

### Step 4: Check Backend Environment

Make sure `.env` has:
```env
SUPABASE_URL=https://ergnrfsqzghjseovmzkg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Long key, not anon key
```

## Quick Fixes

### Fix 1: Bypass RLS for Testing
```sql
ALTER TABLE chitietdonhang DISABLE ROW LEVEL SECURITY;
ALTER TABLE donhang DISABLE ROW LEVEL SECURITY;
```

Then test add to cart again. If it works, RLS was the problem.

### Fix 2: Add Service Role Policy
```sql
-- For chitietdonhang
CREATE POLICY "service_role_all" ON chitietdonhang
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- For donhang
CREATE POLICY "service_role_all" ON donhang
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
```

### Fix 3: Verify Service Role Key
```javascript
// In config/db.js, add this log:
console.log('[DB] Using Supabase URL:', process.env.SUPABASE_URL);
console.log('[DB] Using Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');
```

Restart server and check if key is present.

## Expected Behavior

### Successful Add to Cart Flow

1. **Mobile sends request**:
```json
POST /api/cart/add
Authorization: Bearer eyJhbGc...
{
  "variantId": 45,
  "quantity": 1,
  "price": 595000
}
```

2. **Backend processes**:
```
[POST /cart/add] userId= 11 variantId= 45 qty= 1 price= 595000
[POST /cart/add] Cart found/created: cartId= 60
[POST /cart/add] Checking existing item...
[POST /cart/add] No existing item found
[POST /cart/add] Inserting new item: { madonhang: 60, machitietsanpham: 45, soluong: 1, dongia: 595000 }
[POST /cart/add] Inserted successfully: { machitietdonhang: 789, madonhang: 60, ... }
```

3. **Backend responds**:
```json
{
  "message": "Đã thêm vào giỏ hàng",
  "item": { ... }
}
```

4. **Mobile receives success**, shows snackbar

5. **Navigate to cart, GET /api/cart**:
```
[GET /cart] userId = 11
[GET /cart] cartId = 60 items = 1  ← Should be 1, not 0!
```

6. **Mobile displays cart with 1 item**

## Test Checklist

- [ ] Server running on port 3000
- [ ] No errors in server console
- [ ] RLS disabled or policies added
- [ ] Service role key configured
- [ ] variantId exists in chitietsanpham
- [ ] POST /cart/add logs show "Inserted successfully"
- [ ] GET /cart logs show "items = 1" (not 0)
- [ ] Mobile cart screen shows product

## If Still Not Working

1. **Capture full error log** from server console
2. **Share Supabase RLS policies** for donhang and chitietdonhang
3. **Verify database schema**:
   ```sql
   \d chitietdonhang
   ```
4. **Test direct SQL insert** in Supabase SQL Editor
