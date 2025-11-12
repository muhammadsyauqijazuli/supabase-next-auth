import { supabaseAdmin } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Service role not configured (SUPABASE_SERVICE_ROLE_KEY missing)' });
  }

  try {
    const { adminEmail, userEmail, adminPassword, userPassword } = req.body;

    // defaults if not provided
    const adminE = (adminEmail || 'awis@admin.tokokita.com').toLowerCase();
    const userE = (userEmail || 'awis@user.tokokita.com').toLowerCase();
    const adminP = adminPassword || 'Admin#12345';
    const userP = userPassword || 'User#12345';

    // Check existing
    const { data: existingAdmin, error: adminCheckErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', adminE)
      .single();
    if (adminCheckErr && adminCheckErr.code !== 'PGRST116') throw adminCheckErr;

    const { data: existingUser, error: userCheckErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userE)
      .single();
    if (userCheckErr && userCheckErr.code !== 'PGRST116') throw userCheckErr;

    const results = { created: [], skipped: [] };

    if (!existingAdmin) {
      const hashedAdmin = await bcrypt.hash(adminP, 10);
      const { data: newAdmin, error: adminInsErr } = await supabaseAdmin
        .from('users')
        .insert([
          {
            name: 'Awis Admin',
            email: adminE,
            password: hashedAdmin,
            role: 'admin',
            two_factor_enabled: false,
            two_factor_secret: '',
            backup_codes: []
          }
        ])
        .select()
        .single();
      if (adminInsErr) throw adminInsErr;
      results.created.push({ type: 'admin', email: newAdmin.email });
    } else {
      results.skipped.push({ type: 'admin', email: existingAdmin.email });
    }

    if (!existingUser) {
      const hashedUser = await bcrypt.hash(userP, 10);
      const { data: newUser, error: userInsErr } = await supabaseAdmin
        .from('users')
        .insert([
          {
            name: 'Awis User',
            email: userE,
            password: hashedUser,
            role: 'user',
            two_factor_enabled: false,
            two_factor_secret: '',
            backup_codes: []
          }
        ])
        .select()
        .single();
      if (userInsErr) throw userInsErr;
      results.created.push({ type: 'user', email: newUser.email });
    } else {
      results.skipped.push({ type: 'user', email: existingUser.email });
    }

    return res.status(200).json({
      success: true,
      message: 'Seeding completed',
      accounts: results,
      defaults: {
        adminPassword: adminP,
        userPassword: userP
      }
    });
  } catch (error) {
    console.error('Seed accounts error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
