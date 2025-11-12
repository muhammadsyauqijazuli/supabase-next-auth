import { supabaseAdmin } from '../../../lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  const decoded = verifyToken(req);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // GET - Get 2FA status
    if (req.method === 'GET') {
      return res.status(200).json({
        twoFactorEnabled: user.two_factor_enabled,
        twoFAMethod: 'email' // Email OTP only
      });
    }

    // POST - Enable 2FA
    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'enable') {
        console.log('\n📧 Enabling email 2FA for:', user.email);

        // Simply set the flag to true
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ 
            two_factor_enabled: true,
            two_factor_secret: '', // Not needed for email OTP
            backup_codes: [] // Not needed for email OTP
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('  ❌ Failed to enable 2FA:', updateError);
          return res.status(500).json({ error: 'Failed to enable 2FA' });
        }

        console.log('  ✅ Email 2FA enabled successfully!');

        return res.status(200).json({
          success: true,
          message: '2FA enabled successfully. You will receive OTP via email on next login.',
          twoFAMethod: 'email'
        });
      }

      if (action === 'disable') {
        console.log('\n🔓 Disabling 2FA for:', user.email);

        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ 
            two_factor_enabled: false,
            two_factor_secret: '',
            backup_codes: []
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('  ❌ Failed to disable 2FA:', updateError);
          return res.status(500).json({ error: 'Failed to disable 2FA' });
        }

        console.log('  ✅ 2FA disabled successfully!');

        return res.status(200).json({
          success: true,
          message: '2FA disabled successfully'
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Simple 2FA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
