import { supabase, supabaseAdmin } from '../../../lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    console.log('\n📝 Registration with Supabase Auth:');
    console.log('  Email:', email);
    console.log('  Name:', name);

    // Register with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim()
        }
      }
    });

    if (authError) {
      console.log('  ❌ Registration failed:', authError.message);
      return res.status(400).json({ error: authError.message });
    }

    const { user, session } = authData;
    
    console.log('  ✅ Supabase auth registration successful!');
    console.log('  User ID:', user.id);

    // Create user in custom users table
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        name: name.trim(),
        role: 'user',
        password: '', // Not used, using Supabase Auth
        two_factor_enabled: false,
        two_factor_secret: '',
        backup_codes: []
      }])
      .select()
      .single();

    if (userError) {
      console.error('  ❌ Failed to create user in custom table:', userError);
      // Rollback Supabase auth user if custom table insert fails
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    console.log('  ✅ User profile created in custom table');

    // Generate JWT token for API access
    const token = jwt.sign(
      { 
        userId: newUser.id,
        supabaseId: user.id, 
        email: newUser.email,
        role: newUser.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      supabaseSession: session,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        two_factor_enabled: false
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

