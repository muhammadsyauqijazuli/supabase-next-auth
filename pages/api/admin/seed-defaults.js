import { supabaseAdmin } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';

/**
 * Seed Default Accounts (admin@example.com & user@example.com)
 * No auth required - for initial setup only
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ 
      error: 'Service role not configured',
      message: 'SUPABASE_SERVICE_ROLE_KEY is missing in .env.local'
    });
  }

  try {
    console.log('\n🌱 Seeding default accounts...');
    
    const results = {
      created: [],
      skipped: [],
      updated: []
    };

    // Admin account
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    
    console.log('Checking admin account...');
    const { data: existingAdmin, error: adminCheckErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .maybeSingle();
    
    if (adminCheckErr) {
      console.error('Error checking admin:', adminCheckErr);
      throw adminCheckErr;
    }

    if (!existingAdmin) {
      const { data: newAdmin, error: adminInsertErr } = await supabaseAdmin
        .from('users')
        .insert([{
          name: 'Admin',
          email: adminEmail,
          password: adminHash,
          role: 'admin',
          two_factor_enabled: false,
          two_factor_secret: '',
          backup_codes: []
        }])
        .select()
        .single();
      
      if (adminInsertErr) throw adminInsertErr;
      results.created.push({ email: adminEmail, role: 'admin' });
      console.log('✅ Admin created');
    } else {
      results.skipped.push({ email: adminEmail, role: 'admin', reason: 'already exists' });
      console.log('⏭️  Admin already exists');
    }

    // User account
    const userEmail = 'user@example.com';
    const userPassword = 'user123';
    const userHash = await bcrypt.hash(userPassword, 10);
    
    console.log('Checking user account...');
    const { data: existingUser, error: userCheckErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle();
    
    if (userCheckErr) {
      console.error('Error checking user:', userCheckErr);
      throw userCheckErr;
    }

    if (!existingUser) {
      const { data: newUser, error: userInsertErr } = await supabaseAdmin
        .from('users')
        .insert([{
          name: 'John Doe',
          email: userEmail,
          password: userHash,
          role: 'user',
          two_factor_enabled: false,
          two_factor_secret: '',
          backup_codes: []
        }])
        .select()
        .single();
      
      if (userInsertErr) throw userInsertErr;
      results.created.push({ email: userEmail, role: 'user' });
      console.log('✅ User created');
    } else {
      results.skipped.push({ email: userEmail, role: 'user', reason: 'already exists' });
      console.log('⏭️  User already exists');
    }

    console.log('🎉 Seeding completed!\n');

    return res.status(200).json({
      success: true,
      message: 'Default accounts seeded successfully',
      results,
      credentials: {
        admin: {
          email: adminEmail,
          password: adminPassword
        },
        user: {
          email: userEmail,
          password: userPassword
        }
      }
    });

  } catch (error) {
    console.error('❌ Seed error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: error
    });
  }
}
