#!/usr/bin/env node
/**
 * Direct database seeding script - bypasses Next.js API layer
 * Run: node -r dotenv/config scripts/seed-db.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedAccounts() {
  if (!supabaseAdmin) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not configured');
    process.exit(1);
  }

  try {
    console.log('🌱 Starting database seed...\n');

    const accounts = [
      {
        name: 'Awis Admin',
        email: 'awis@admin.tokokita.com',
        password: 'AdminKu@2025',
        role: 'admin'
      },
      {
        name: 'Awis User',
        email: 'awis@user.tokokita.com',
        password: 'UserKu@2025',
        role: 'user'
      }
    ];

    const results = { created: [], skipped: [] };

    for (const account of accounts) {
      // Check if exists
      const { data: existing, error: checkErr } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', account.email.toLowerCase())
        .single();

      if (checkErr && checkErr.code !== 'PGRST116') {
        throw checkErr;
      }

      if (existing) {
        console.log(`⏭️  Skipped: ${account.email} (already exists)`);
        results.skipped.push({ email: account.email, role: account.role });
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(account.password, 10);

      // Create user
      const { data: newUser, error: insertErr } = await supabaseAdmin
        .from('users')
        .insert([
          {
            name: account.name,
            email: account.email.toLowerCase(),
            password: hashedPassword,
            role: account.role,
            two_factor_enabled: false,
            two_factor_secret: '',
            backup_codes: []
          }
        ])
        .select()
        .single();

      if (insertErr) throw insertErr;

      console.log(`✅ Created: ${account.email} (${account.role})`);
      results.created.push({ email: newUser.email, role: newUser.role });
    }

    console.log('\n📊 Seed Results:');
    console.log(`   Created: ${results.created.length}`);
    console.log(`   Skipped: ${results.skipped.length}`);

    if (results.created.length > 0) {
      console.log('\n🔐 Credentials:');
      accounts.forEach(acc => {
        if (results.created.find(c => c.email === acc.email)) {
          console.log(`   ${acc.email}: ${acc.password}`);
        }
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seedAccounts();
