import { db, supabaseAdmin } from '../../lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
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
    // GET - Get user's orders
    if (req.method === 'GET') {
      const orders = await db.orders.findByUserId(decoded.userId);

      return res.status(200).json({
        success: true,
        orders
      });
    }

    // POST - Create new order (checkout)
    if (req.method === 'POST') {
      const { items, total, paymentProof, autoComplete } = req.body;

      // Validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items are required' });
      }

      if (!total || total <= 0) {
        return res.status(400).json({ error: 'Invalid total amount' });
      }

      if (!paymentProof) {
        return res.status(400).json({ error: 'Payment proof is required' });
      }

      // Get user
      const user = await db.users.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify stock availability and calculate total
      let calculatedTotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await db.products.findById(item.productId);
        
        if (!product) {
          return res.status(404).json({ error: `Product ${item.productId} not found` });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
          });
        }

        calculatedTotal += product.price * item.quantity;
        orderItems.push({
          product_id: product.id,
          product_name: product.name,
          product_image: product.image,
          quantity: item.quantity,
          price: product.price
        });
      }

      // Verify total
      if (Math.abs(calculatedTotal - total) > 0.01) {
        return res.status(400).json({ error: 'Total amount mismatch' });
      }

      // Create order
      // Determine initial status. If autoComplete flag set by client, mark directly as completed.
      // NOTE: This bypasses the normal admin processing flow.
      const initialStatus = autoComplete ? 'completed' : 'pending';

      const order = await db.orders.create({
        user_id: user.id,
        user_email: user.email,
        user_name: user.name,
        items: orderItems,
        total: calculatedTotal,
        status: initialStatus,
        payment_proof: paymentProof
      });

      // Reduce stock and increase sold count
      for (const item of items) {
        await db.products.updateStock(item.productId, item.quantity);
      }

      return res.status(201).json({
        success: true,
        order
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Orders API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
