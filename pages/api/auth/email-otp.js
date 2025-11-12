import { supabaseAdmin } from '../../../lib/supabase';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Store OTP codes temporarily (in production, use Redis or database)
const otpStore = new Map();

// Generate random 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, tempToken, code } = req.body;

    // SEND OTP via email
    if (action === 'send') {
      if (!tempToken) {
        return res.status(400).json({ error: 'Temp token required' });
      }

      // Verify temp token
      let decoded;
      try {
        decoded = jwt.verify(tempToken, JWT_SECRET);
        if (!decoded.temp) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Token expired or invalid' });
      }

      const { userId, email } = decoded;

      console.log('\n📧 Sending OTP to:', email);

      // Generate OTP
      const otp = generateOTP();
      
      // Store OTP with expiry (5 minutes)
      const otpData = {
        code: otp,
        userId,
        email,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      };
      otpStore.set(email, otpData);

      console.log('  Generated OTP:', otp);
      console.log('  Expires at:', new Date(otpData.expiresAt).toLocaleTimeString());

      // Send email via Supabase Auth (if email service configured)
      // For now, we'll just log it (in production, use proper email service)
      try {
        // Supabase email sending (requires SMTP setup in Supabase Dashboard)
        // await supabaseAdmin.auth.admin.sendEmail(email, {
        //   type: 'signup',
        //   subject: 'Your 2FA Code',
        //   content: `Your verification code is: ${otp}`
        // });

        console.log('  ✅ OTP generated successfully');
        console.log('  📧 [DEV MODE] OTP Code:', otp);
        
      } catch (emailError) {
        console.error('  ⚠️  Email send failed, but OTP stored:', emailError);
      }

      return res.status(200).json({
        success: true,
        message: 'OTP sent to your email',
        // In development, send OTP in response
        devOTP: process.env.NODE_ENV === 'development' ? otp : undefined
      });
    }

    // VERIFY OTP
    if (action === 'verify') {
      if (!tempToken || !code) {
        return res.status(400).json({ error: 'Temp token and code required' });
      }

      // Verify temp token
      let decoded;
      try {
        decoded = jwt.verify(tempToken, JWT_SECRET);
        if (!decoded.temp) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Token expired or invalid' });
      }

      const { userId, email } = decoded;

      console.log('\n🔐 Verifying OTP for:', email);
      console.log('  Provided code:', code);

      // Get stored OTP
      const storedOTP = otpStore.get(email);

      if (!storedOTP) {
        console.log('  ❌ No OTP found');
        return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
      }

      // Check expiry
      if (Date.now() > storedOTP.expiresAt) {
        console.log('  ❌ OTP expired');
        otpStore.delete(email);
        return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
      }

      // Verify code
      if (storedOTP.code !== code) {
        console.log('  ❌ Invalid code');
        return res.status(401).json({ error: 'Invalid OTP code' });
      }

      console.log('  ✅ OTP verified successfully!');

      // Delete used OTP
      otpStore.delete(email);

      // Get user data
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate final JWT token
      const token = jwt.sign(
        { 
          userId: userData.id,
          email: userData.email,
          role: userData.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          twoFactorEnabled: true
        }
      });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Email OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
