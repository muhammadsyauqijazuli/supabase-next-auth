import { db } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const existingAdmins = await db.users.findAdmins();
    const decoded = verifyToken(req);

    // Bootstrap mode: if no admin exists yet, allow creation without token
    const bootstrapMode = existingAdmins.length === 0;
    if (!bootstrapMode) {
      if (!decoded || decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Admin privilege required' });
      }
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await db.users.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = await db.users.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      two_factor_enabled: false,
      two_factor_secret: '',
      backup_codes: []
    });

    // Issue token for new admin (optional convenience)
    const token = jwt.sign({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      bootstrapMode,
      token,
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
