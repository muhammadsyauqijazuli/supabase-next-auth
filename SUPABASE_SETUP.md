# Supabase Setup Guide

## 🚀 Quick Start

### 1. Create Supabase Account
1. Kunjungi [https://supabase.com](https://supabase.com)
2. Sign up dengan GitHub atau Email
3. Create New Project
   - Name: `ecommerce-2fa`
   - Database Password: Generate strong password (simpan!)
   - Region: Southeast Asia (Singapore)
   - Plan: **FREE** tier

### 2. Setup Database Schema
1. Buka Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy semua isi dari file `supabase-schema.sql`
4. Paste ke SQL Editor
5. Click **"Run"** atau tekan `Ctrl+Enter`
6. Tunggu hingga sukses (lihat pesan: "Success. No rows returned")

### 3. Get API Credentials
1. Buka **Settings** → **API**
2. Copy credentials:
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGc...
   ```

### 4. Setup Environment Variables
1. Buat file `.env.local` di root project:
   ```bash
   cp .env.template .env.local
   ```

2. Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   JWT_SECRET=your_32_character_random_string
   NODE_ENV=development
   ```

3. Generate JWT Secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### 5. Install Dependencies & Run
```bash
npm install
npm run dev
```

---

## 🔐 Default Accounts

Setelah setup schema, Anda bisa login dengan:

**Admin Account:**
- Email: `admin@example.com`
- Password: `admin123`

**User Account:**
- Email: `user@example.com`
- Password: `user123`

⚠️ **PENTING**: Ganti password default setelah login!

---

## 📊 Database Tables

### users
- `id` - UUID primary key
- `name` - Nama lengkap user
- `email` - Email (unique)
- `password` - Password (bcrypt hashed)
- `role` - user | admin
- `two_factor_enabled` - Boolean
- `two_factor_secret` - TOTP secret
- `backup_codes` - Array of backup codes

### products
- `id` - UUID primary key
- `name` - Nama produk
- `description` - Deskripsi
- `price` - Harga (decimal)
- `stock` - Stock tersedia
- `category` - Kategori
- `image` - URL gambar
- `sold` - Jumlah terjual

### orders
- `id` - UUID primary key
- `user_id` - Foreign key ke users
- `user_email` - Email pembeli
- `user_name` - Nama pembeli
- `items` - JSONB array items
- `total` - Total harga
- `status` - pending | processing | completed | cancelled
- `payment_proof` - Bukti pembayaran
- `cancel_reason` - Alasan cancel (opsional)
- `completed_at` - Waktu selesai

---

## 🔒 Row Level Security (RLS)

Supabase menggunakan PostgreSQL RLS untuk keamanan:

- ✅ Users hanya bisa baca data sendiri
- ✅ Products bisa dibaca siapa saja
- ✅ Orders hanya bisa dibuat dan dibaca oleh user pemilik
- ✅ Admin access dihandle di API layer (JWT)

---

## 🧪 Testing Database

### Via Supabase Dashboard:
1. **Table Editor** → Lihat data di tabel
2. **SQL Editor** → Run query manual:
   ```sql
   SELECT * FROM users;
   SELECT * FROM products WHERE stock > 0;
   SELECT * FROM orders ORDER BY created_at DESC;
   ```

### Via Application:
```bash
npm run dev
# Test register: http://localhost:3000/register
# Test login: http://localhost:3000/login
# Test products: http://localhost:3000
```

---

## 📦 Sample Products

8 produk electronics sudah ter-seed:
1. Laptop HP Pavilion - Rp 12.000.000
2. Mouse Logitech G502 - Rp 750.000
3. Keyboard Mechanical RGB - Rp 1.200.000
4. Monitor LG 27 inch - Rp 3.500.000
5. Headset HyperX Cloud II - Rp 950.000
6. Webcam Logitech C920 - Rp 1.100.000
7. SSD Samsung 1TB - Rp 1.800.000
8. RAM Corsair 16GB DDR4 - Rp 1.300.000

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
**Solution**: 
- Pastikan `.env.local` sudah dibuat
- Copy-paste anon key dari Supabase Dashboard
- Restart dev server (`npm run dev`)

### Error: "relation does not exist"
**Solution**: 
- Jalankan ulang `supabase-schema.sql` di SQL Editor
- Pastikan tidak ada error saat run schema

### Error: "new row violates row-level security policy"
**Solution**: 
- Ini normal karena RLS aktif
- API routes sudah handle authentication
- Pastikan kirim JWT token di header

### Products tidak muncul
**Solution**:
```sql
-- Check products
SELECT * FROM products;

-- If empty, run seed again from supabase-schema.sql
-- atau insert manual
```

---

## 🚀 Deploy to Production

### Environment Variables di Vercel:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
JWT_SECRET=<production_secret>
NODE_ENV=production
```

### Keuntungan Supabase FREE Tier:
- ✅ 500MB database storage
- ✅ 5GB file storage
- ✅ 2GB bandwidth
- ✅ 50,000 monthly active users
- ✅ 500K edge function invocations
- ✅ Real-time subscriptions
- ✅ Auto backups (7 days)

---

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**Ready to use!** 🎉
