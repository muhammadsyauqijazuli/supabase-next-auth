# 🛒 E-Commerce with 2FA Authentication

> **Production-ready e-commerce platform** dengan autentikasi dua faktor menggunakan Next.js dan Supabase PostgreSQL

[![Next.js](https://img.shields.io/badge/Next.js-13.5.6-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.0-38B2AC)](https://tailwindcss.com/)

---

## 📋 Daftar Isi
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Environment Setup](#-environment-setup)
- [Database Setup](#-database-setup)
- [Development](#-development)
- [Deployment](#-deployment)
- [Security](#-security)
- [API Documentation](#-api-documentation)

---

## ✨ Features

### 🔐 Authentication & Security
- ✅ **User Registration & Login** dengan email/password
- ✅ **Two-Factor Authentication (2FA)** menggunakan Google Authenticator
- ✅ **Backup Codes** - 10 kode cadangan (format XXXX-XXXX)
- ✅ **JWT Authentication** dengan 7 hari expiry
- ✅ **Password Hashing** dengan bcrypt (salt rounds: 10)
- ✅ **Role-Based Access Control** - User & Admin roles

### 🛍️ E-Commerce Features
- ✅ **Product Catalog** dengan kategori dan filter
- ✅ **Shopping Cart** dengan real-time total calculation
- ✅ **Order Management** - Create, track, update orders
- ✅ **Payment Proof Upload** - Bukti transfer
- ✅ **Stock Management** - Auto-decrement on purchase
- ✅ **Order Status Tracking** - Pending → Processing → Completed/Cancelled

### 👤 User Features
- ✅ **User Dashboard** dengan order history
- ✅ **Profile Management** dengan 2FA controls
- ✅ **Real-time Order Updates** (via periodic refresh)
- ✅ **Order Cancellation** dengan alasan

### 👨‍💼 Admin Features
- ✅ **Admin Dashboard** dengan statistik real-time
- ✅ **Order Management** - Process, complete, cancel orders
- ✅ **Product Management** - Add/edit products
- ✅ **Auto-refresh Dashboard** setiap 5 detik
- ✅ **Order Statistics** by status

### 🎨 UI/UX
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Loading States** - Smooth loading indicators
- ✅ **Toast Notifications** - User feedback
- ✅ **Modern UI** - Clean & professional design
- ✅ **Smooth Animations** - Fade & slide transitions

---

## 🛠 Tech Stack

### Frontend
- **Next.js 13.5.6** - React framework dengan SSR & API routes
- **React 18.2.0** - UI library dengan hooks
- **TailwindCSS 3.3.0** - Utility-first CSS framework

### Backend & Database
- **Supabase** - PostgreSQL database (FREE tier)
- **Row Level Security (RLS)** - Database-level security
- **UUID Primary Keys** - Secure identifiers

### Authentication & Security
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT token generation
- **otplib** - TOTP-based 2FA
- **qrcode** - QR code generation for 2FA setup

### Deployment
- **Vercel** - Frontend & API hosting
- **Supabase** - Database hosting

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ & npm
- Supabase account (FREE)
- Git

### Installation

```bash
# 1. Clone repository
git clone <your-repo-url>
cd ecommerce-2fa

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.template .env.local
# Edit .env.local dengan Supabase credentials

# 4. Setup database (lihat Database Setup section)

# 5. Run development server
npm run dev

# 6. Open browser
# http://localhost:3000
```

---

## 🔧 Environment Setup

### 1. Create `.env.local`
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Service Role (server-side only, DO NOT expose to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(service_role_key)

# JWT Secret for 2FA
JWT_SECRET=your_32_character_secret_key

# Environment
NODE_ENV=development
```

### 2. Get Supabase Credentials
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Create New Project → Choose **FREE** tier
3. Settings → API → Copy:
   - Project URL
   - anon/public key

### 3. Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Why Service Role Key Matters (RLS & Login)
Supabase Row Level Security (RLS) membatasi akses ke tabel `users`. Policy default hanya mengizinkan user membaca datanya sendiri (auth.uid() match). Saat login, kita belum punya sesi, sehingga SELECT email akan ditolak jika menggunakan hanya anon key. Solusi:

| Opsi | Keamanan | Cara |
|------|----------|------|
| Service Role Key | Tinggi (server-only) | Tambahkan `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local` lalu restart server. API routes akan memakai client admin untuk lookup email & seeding akun. |
| Broad SELECT Policy | Lebih rendah | Tambahkan policy publik SELECT/INSERT di `supabase-schema.sql` (baris yang dikomentari) lalu jalankan di SQL Editor. |

Rekomendasi: Gunakan service role key. Pastikan key tidak pernah terkirim ke browser (hanya variabel tanpa prefix `NEXT_PUBLIC_`).

---

## 🗄️ Database Setup

### 1. Create Supabase Project
1. Kunjungi [https://supabase.com](https://supabase.com)
2. Sign up & Create New Project
   - Name: `ecommerce-2fa`
   - Password: Strong password
   - Region: Singapore (Southeast Asia)
   - Plan: **FREE**

### 2. Run SQL Schema
1. Buka Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Copy semua isi dari `supabase-schema.sql`
4. Paste & **Run** (Ctrl+Enter)
5. Verify: Lihat success message

### 3. Verify Tables
```sql
SELECT * FROM users;      -- Should return 2 users (admin & user)
SELECT * FROM products;   -- Should return 8 products
SELECT * FROM orders;     -- Empty initially
```

### 📊 Default Accounts

⚠️ **Password telah direset untuk testing!**

**Admin:**
- Email: `admin@example.com`
- Password: `admin123`
- Role: Admin
- 2FA: Disabled (untuk testing awal)

**User:**
- Email: `user@example.com`
- Password: `user123`
- Role: User  
- 2FA: Disabled (untuk testing awal)

💡 **Tips:**
- Gunakan script `node scripts/reset-passwords.js` jika perlu reset password
- Password sudah di-hash dengan bcrypt (10 salt rounds)
- Setelah login, aktifkan 2FA di halaman Profile untuk testing flow 2FA

⚠️ **PENTING**: Ganti password setelah deploy ke production!

### 🔄 Seeding Custom Admin/User
Endpoint khusus tersedia untuk membuat akun admin & user baru dengan service role:

POST `/api/admin/seed-accounts`
```json
{
  "adminEmail": "awis@admin.tokokita.com",
  "userEmail": "awis@user.tokokita.com",
  "adminPassword": "AdminKu@2025",
  "userPassword": "UserKu@2025"
}
```

Jika akun sudah ada akan di-skip. Pastikan `SUPABASE_SERVICE_ROLE_KEY` sudah terpasang sebelum memanggil endpoint ini.

---

## 💻 Development

### Project Structure
```
ecommerce-2fa/
├── pages/
│   ├── _app.js                 # App wrapper
│   ├── index.js                # Homepage (product catalog)
│   ├── register.js             # User registration
│   ├── login.js                # Login dengan 2FA
│   ├── profile.js              # User profile & 2FA management
│   ├── dashboard.js            # User dashboard
│   ├── user/
│   │   └── orders.js           # User order history
│   ├── admin/
│   │   └── dashboard.js        # Admin dashboard
│   └── api/
│       ├── auth/
│       │   ├── register.js     # Registration API
│       │   ├── login.js        # Login API
│       │   ├── verify-2fa.js   # 2FA verification API
│       │   └── 2fa-setup.js    # 2FA setup API
│       ├── products.js         # Products API
│       ├── orders.js           # Orders API
│       └── admin/
│           └── orders.js       # Admin orders API
├── components/
│   ├── Header.js               # Navigation header
│   ├── Loading.js              # Loading component
│   ├── Toast.js                # Toast notifications
│   └── admin/
│       └── StatsCard.js        # Statistics card
├── lib/
│   ├── supabase.js             # Supabase client & helpers
│   ├── twofactor.js            # 2FA utilities
│   └── validator.js            # Input validation
├── styles/
│   └── globals.css             # Global styles
├── public/
│   └── images/                 # Product images
├── supabase-schema.sql         # Database schema
├── .env.template               # Environment template
├── .env.local                  # Environment variables (gitignored)
└── package.json                # Dependencies
```

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Run ESLint
```

### Development Workflow
1. Create feature branch: `git checkout -b feature/nama-fitur`
2. Make changes & test locally
3. Commit: `git commit -m "feat: deskripsi fitur"`
4. Push: `git push origin feature/nama-fitur`
5. Create Pull Request

---

## 🚀 Deployment

### Deploy to Vercel

#### Via GitHub (Recommended)
1. Push code ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
   JWT_SECRET=<your_jwt_secret>
   NODE_ENV=production
   ```
4. Deploy

#### Via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts
# Add environment variables via Vercel Dashboard
```

### Post-Deployment
1. Test registration
2. Test login dengan 2FA
3. Test order flow
4. Verify admin dashboard

---

## 🔒 Security

### Implemented Security Features
- ✅ **Password Hashing** - bcrypt dengan salt rounds 10
- ✅ **JWT Authentication** - Token-based dengan 7 hari expiry
- ✅ **2FA Protection** - TOTP + backup codes
- ✅ **Row Level Security** - Database-level di Supabase
- ✅ **Input Validation** - Email, password, data validation
- ✅ **HTTPS Only** - Production deployment
- ✅ **Environment Variables** - Secrets tidak di-commit
- ✅ **Role-Based Access** - User & Admin separation

### Security Best Practices
1. **Never commit `.env.local`** - Gitignored by default
2. **Change default passwords** - After first login
3. **Use strong JWT secret** - Minimum 32 characters
4. **Enable 2FA** - For all admin accounts
5. **Regular backups** - Supabase auto-backup 7 days
6. **Monitor logs** - Check Vercel & Supabase logs

### Known Limitations
- ⚠️ Real-time updates via polling (5s refresh) - Consider Supabase Realtime
- ⚠️ File uploads to public folder - Consider CDN/S3
- ⚠️ No rate limiting - Add rate limiter for production

---

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "twoFactorEnabled": false
  }
}
```

#### POST `/api/auth/login`
Login with email & password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "user123"
}
```

**Response (No 2FA):**
```json
{
  "success": true,
  "requires2FA": false,
  "token": "jwt_token",
  "user": { ... }
}
```

**Response (With 2FA):**
```json
{
  "success": true,
  "requires2FA": true,
  "tempToken": "temp_token_for_5min",
  "user": { ... }
}
```

#### POST `/api/auth/verify-2fa`
Verify 2FA code (TOTP or backup code).

**Request:**
```json
{
  "tempToken": "temp_token",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "usedBackupCode": false,
  "remainingBackupCodes": 10
}
```

### Products Endpoints

#### GET `/api/products`
Get all products with stock > 0.

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "name": "Laptop HP",
      "price": 12000000,
      "stock": 10,
      "category": "Electronics",
      "image": "/images/products/laptop.jpg"
    }
  ]
}
```

### Orders Endpoints

#### GET `/api/orders`
Get user's orders. **Requires authentication**.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "uuid",
      "items": [...],
      "total": 12000000,
      "status": "pending",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/orders`
Create new order (checkout). **Requires authentication**.

**Request:**
```json
{
  "items": [
    { "productId": "uuid", "quantity": 1 }
  ],
  "total": 12000000,
  "paymentProof": "BCA-1234567890"
}
```

### Admin Endpoints

#### GET `/api/admin/orders`
Get all orders with statistics. **Admin only**.

**Query Params:**
- `status` - Filter by status (pending, processing, completed, cancelled, all)

**Response:**
```json
{
  "success": true,
  "orders": [...],
  "stats": {
    "pending": { "count": 5, "total": 50000000 },
    "processing": { "count": 3, "total": 30000000 },
    "completed": { "count": 10, "total": 100000000 },
    "cancelled": { "count": 2, "total": 10000000 }
  }
}
```

#### PUT `/api/admin/orders`
Update order status. **Admin only**.

**Request:**
```json
{
  "orderId": "uuid",
  "status": "processing",
  "cancelReason": "Optional reason"
}
```

---

## 📖 Additional Documentation

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Detailed Supabase setup guide
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history & changes
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Manual testing guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
**Solution**: 
- Check `.env.local` exists dan berisi credentials benar
- Restart dev server: `npm run dev`

### Error: "relation does not exist"
**Solution**: 
- Run `supabase-schema.sql` di Supabase SQL Editor
- Verify tables created: `SELECT * FROM users;`

### Products tidak muncul
**Solution**:
- Check products di Supabase Table Editor
- Re-run seed data dari `supabase-schema.sql`

### 2FA QR code tidak muncul
### Login selalu "Invalid email or password"
Kemungkinan penyebab:
1. Akun belum ada (seeding gagal karena RLS) → Set `SUPABASE_SERVICE_ROLE_KEY` lalu panggil `/api/admin/seed-accounts`.
2. RLS menolak SELECT email (error code 42501) karena service role belum dikonfigurasi → Tambahkan service role key atau aktifkan policy SELECT publik yang dikomentari.
3. Password salah → Verifikasi hash di tabel `users` dan coba reset.

Langkah cepat perbaikan:
1. Tambah `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local`.
2. Restart dev server.
3. Cek server log: Harus ada warning hilang.
4. Panggil endpoint seeding.
5. Coba login lagi.
**Solution**:
- Check browser console untuk errors
- Verify `otplib` dan `qrcode` installed

---

## 📝 License

MIT License - Free to use untuk personal & commercial projects.

---

## 👨‍💻 Author

**AWIS Dev Team**

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - Framework
- [Supabase](https://supabase.com/) - Database & auth
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Vercel](https://vercel.com/) - Hosting

---

**⭐ Star this repo jika bermanfaat!**

**🐛 Found a bug?** Open an issue!

**💡 Have suggestions?** Pull requests welcome!
