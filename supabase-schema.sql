-- ============================================
-- SUPABASE DATABASE SCHEMA
-- E-Commerce with 2FA Authentication
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT DEFAULT '',
  backup_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- TABLE: products
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category VARCHAR(100) DEFAULT 'Uncategorized',
  image TEXT,
  sold INTEGER DEFAULT 0 CHECK (sold >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for filtering and sorting
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_price ON products(price);

-- ============================================
-- TABLE: orders
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(12, 2) NOT NULL CHECK (total >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  payment_proof TEXT NOT NULL,
  cancel_reason TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for queries
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users: Allow read for authenticated users
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users: Allow update for authenticated users (untuk 2FA, profile, dll)
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE 
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- OPTIONAL: Uncomment the following policies if you want to allow
-- email/password login and registration using anon key without service role.
-- These are broader and should be combined with application-level validation.
--
-- CREATE POLICY "Allow public email lookup" ON users
--   FOR SELECT USING (true);
-- CREATE POLICY "Allow public registration" ON users
--   FOR INSERT WITH CHECK (true);

-- Products: Public read access
CREATE POLICY "Anyone can read products" ON products
  FOR SELECT USING (true);

-- Orders: Users can only see their own orders
CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Orders: Users can create orders
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================
-- SEED DATA
-- ============================================
-- NOTE: Hash values are generated fresh each time. 
-- Run generate-correct-hashes.js to get new hashes if needed.

-- Delete old users first (optional, uncomment if re-seeding)
-- DELETE FROM users WHERE email IN ('admin@example.com', 'user@example.com');

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt, rounds=10)
-- Hash generated: 2025-01-12
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@example.com', '$2a$10$rhuxT.aZA1h4AaBhm72SC.sbzgWWwls6uHh2m3Xf4JrjvD9lZ6MVe', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample user
-- Password: user123
-- Hash generated: 2025-01-12
INSERT INTO users (name, email, password, role) VALUES
('John Doe', 'user@example.com', '$2a$10$XwYmgAY0UUrjftehSIa6qehINgah4zM690ZPNJn135.FPXsXXeoRG', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, stock, category, image) VALUES
('Laptop HP Pavilion', 'Laptop gaming dengan spesifikasi tinggi, RAM 16GB, SSD 512GB', 12000000, 10, 'Electronics', '/images/products/laptop.jpg'),
('Mouse Logitech G502', 'Mouse gaming dengan 11 tombol programmable', 750000, 25, 'Electronics', '/images/products/mouse.jpg'),
('Keyboard Mechanical RGB', 'Keyboard mechanical dengan lampu RGB dan switch Cherry MX', 1200000, 15, 'Electronics', '/images/products/keyboard.jpg'),
('Monitor LG 27 inch', 'Monitor IPS 27 inch dengan resolusi 2K', 3500000, 8, 'Electronics', '/images/products/monitor.jpg'),
('Headset HyperX Cloud II', 'Headset gaming dengan 7.1 virtual surround sound', 950000, 20, 'Electronics', '/images/products/headset.jpg'),
('Webcam Logitech C920', 'Webcam Full HD 1080p untuk streaming dan video call', 1100000, 12, 'Electronics', '/images/products/webcam.jpg'),
('SSD Samsung 1TB', 'SSD NVMe M.2 dengan kecepatan baca 3500MB/s', 1800000, 30, 'Electronics', '/images/products/ssd.jpg'),
('RAM Corsair 16GB DDR4', 'RAM gaming dengan heatsink dan RGB lighting', 1300000, 18, 'Electronics', '/images/products/ram.jpg')
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFY INSTALLATION
-- ============================================
SELECT 'Schema created successfully!' AS message;
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS product_count FROM products;
