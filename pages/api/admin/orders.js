import { db } from '../../../lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token and check admin role
function verifyAdminToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  const decoded = verifyAdminToken(req);
  if (!decoded) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    // GET - Get all orders (admin view)
    if (req.method === 'GET') {
      const { status } = req.query;
      
      const orders = await db.orders.getAll(status);
      const stats = await db.orders.getStats();

      return res.status(200).json({
        success: true,
        orders,
        stats
      });
    }

    // PUT - Update order status
    if (req.method === 'PUT') {
      const { orderId, status, cancelReason } = req.body;

      if (!orderId || !status) {
        return res.status(400).json({ error: 'Order ID and status are required' });
      }

      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updates = { status };
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      if (status === 'cancelled' && cancelReason) {
        updates.cancel_reason = cancelReason;
      }

      const order = await db.orders.update(orderId, updates);

      return res.status(200).json({
        success: true,
        order
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Admin orders API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
