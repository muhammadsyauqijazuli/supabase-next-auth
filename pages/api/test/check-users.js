import { db, supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  try {
    console.log('\n🔍 Checking Database...');
    
    // Check if service role is available
    const hasServiceRole = !!supabaseAdmin;
    console.log('Service Role:', hasServiceRole ? '✅ Available' : '❌ Missing');
    
    // Try to get users
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*');
    
    if (error) {
      console.error('❌ Database Error:', error);
      return res.status(500).json({ 
        error: error.message,
        code: error.code,
        details: error.details 
      });
    }
    
    console.log(`✅ Found ${users.length} users`);
    
    // Check specific user
    const admin = users.find(u => u.email === 'admin@example.com');
    console.log('Admin user:', admin ? '✅ Found' : '❌ Not Found');
    
    if (admin) {
      console.log('  Password hash starts with:', admin.password.substring(0, 10));
    }
    
    return res.status(200).json({
      success: true,
      hasServiceRole,
      userCount: users.length,
      users: users.map(u => ({
        email: u.email,
        role: u.role,
        twoFactorEnabled: u.two_factor_enabled,
        passwordHashStart: u.password.substring(0, 10)
      }))
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: error.message 
    });
  }
}
