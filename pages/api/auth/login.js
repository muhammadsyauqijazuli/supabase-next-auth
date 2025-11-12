import { supabase, supabaseAdmin, db } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('\n🔐 Login Attempt:');
    console.log('  Email:', email);

    // Try Supabase Auth first (for new users)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // If Supabase Auth fails, try legacy bcrypt authentication
    if (authError) {
      console.log('  ⚠️  Supabase Auth failed, trying legacy auth...');
      
      // Find user in custom table
      const user = await db.users.findByEmail(email);
      
      if (!user) {
        console.log('  ❌ User not found');
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if user has a password (legacy user)
      if (!user.password || user.password === '') {
        console.log('  ❌ User has no legacy password');
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password with bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        console.log('  ❌ Legacy password mismatch');
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      console.log('  ✅ Legacy auth successful!');
      console.log('  2FA Status:', user.two_factor_enabled ? '✅ Enabled' : '❌ Disabled');

      // Check if 2FA is enabled
      if (user.two_factor_enabled) {
        console.log('  � 2FA enabled - will send email OTP');
        
        const tempToken = jwt.sign(
          { userId: user.id, temp: true, email: user.email },
          JWT_SECRET,
          { expiresIn: '5m' }
        );

        return res.status(200).json({
          success: true,
          requires2FA: true,
          tempToken,
          twoFAMethod: 'email', // Use email OTP
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        });
      }

      // Generate JWT token (legacy user without 2FA)
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        requires2FA: false,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          two_factor_enabled: user.two_factor_enabled || false
        }
      });
    }

    // Supabase Auth successful
    console.log('  ✅ Supabase Auth successful!');
    
    const { user, session } = authData;
    console.log('  User ID:', user.id);

    // Check if MFA is enrolled
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const hasMFA = factors && factors.totp && factors.totp.length > 0;

    console.log('  MFA Status:', hasMFA ? '✅ Enabled' : '❌ Disabled');

    // Get user data from our custom users table
    let userData = null;
    const { data: userDataResult, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, two_factor_enabled')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !userDataResult) {
      console.log('  ⚠️  User not found in custom table, creating...');
      // Create user in custom table if not exists
      const { data: newUser } = await supabaseAdmin
        .from('users')
        .insert([{
          email: email.toLowerCase(),
          name: email.split('@')[0],
          role: 'user',
          password: '', // Not used anymore, using Supabase Auth
          two_factor_enabled: hasMFA
        }])
        .select()
        .single();
      
      userData = newUser;
    } else {
      userData = userDataResult;
    }

    // Check if 2FA is enabled (either Supabase MFA OR custom table 2FA)
    const is2FAEnabled = hasMFA || userData.two_factor_enabled;

    console.log('  📧 Custom 2FA Status:', userData.two_factor_enabled ? '✅ Enabled' : '❌ Disabled');
    console.log('  🔐 Final 2FA Required:', is2FAEnabled ? '✅ Yes' : '❌ No');

    // If 2FA is enabled (email OTP or Supabase MFA)
    if (is2FAEnabled) {
      const tempToken = jwt.sign(
        { userId: userData.id, temp: true, email: userData.email },
        JWT_SECRET,
        { expiresIn: '5m' }
      );

      console.log('  📧 Sending temp token for 2FA verification...');

      return res.status(200).json({
        success: true,
        requires2FA: true,
        tempToken,
        twoFAMethod: 'email',
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role
        }
      });
    }

    // Generate our custom JWT token for API access
    const token = jwt.sign(
      { 
        userId: userData.id,
        supabaseId: user.id, 
        email: userData.email,
        role: userData.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      requires2FA: false,
      token,
      supabaseSession: session,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        two_factor_enabled: userData.two_factor_enabled || false
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

