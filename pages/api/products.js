import { db } from '../../lib/supabase';

export default async function handler(req, res) {
  try {
    // GET - Get all products
    if (req.method === 'GET') {
      const products = await db.products.getAll();

      return res.status(200).json({
        success: true,
        products
      });
    }

    // POST - Create new product (admin only)
    if (req.method === 'POST') {
      const { name, description, price, stock, category, image } = req.body;

      // Validation
      if (!name || !price || stock === undefined) {
        return res.status(400).json({ error: 'Name, price, and stock are required' });
      }

      const product = await db.products.create({
        name,
        description: description || '',
        price,
        stock,
        category: category || 'Uncategorized',
        image: image || '/images/products/default.jpg',
        sold: 0
      });

      return res.status(201).json({
        success: true,
        product
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
