import { supabaseAdmin } from '../../../lib/supabase';

/**
 * Seed Products - Create default products in database
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
    console.log('\n🌱 Seeding products...');
    
    const products = [
      {
        name: 'Laptop Gaming',
        description: 'Laptop gaming dengan spesifikasi tinggi untuk pengalaman bermain optimal',
        price: 15000000,
        stock: 10,
        category: 'Electronics',
        image: '/images/products/laptop.svg',
        sold: 0
      },
      {
        name: 'Smartphone Flagship',
        description: 'Smartphone terbaru dengan kamera canggih dan performa maksimal',
        price: 8000000,
        stock: 15,
        category: 'Electronics',
        image: '/images/products/smartphone.svg',
        sold: 0
      },
      {
        name: 'Headphone Wireless',
        description: 'Headphone dengan teknologi noise cancellation dan konektivitas Bluetooth',
        price: 1200000,
        stock: 20,
        category: 'Audio',
        image: '/images/products/headphone.svg',
        sold: 0
      },
      {
        name: 'Smart Watch',
        description: 'Jam tangan pintar dengan fitur kesehatan dan notifikasi smartphone',
        price: 2500000,
        stock: 8,
        category: 'Wearables',
        image: '/images/products/smartwatch.svg',
        sold: 0
      },
      {
        name: 'Tablet Android',
        description: 'Tablet dengan layar besar cocok untuk bekerja dan hiburan',
        price: 4500000,
        stock: 12,
        category: 'Electronics',
        image: '/images/products/tablet.svg',
        sold: 0
      },
      {
        name: 'Kamera DSLR',
        description: 'Kamera profesional untuk fotografi dengan kualitas gambar terbaik',
        price: 12000000,
        stock: 5,
        category: 'Photography',
        image: '/images/products/camera.svg',
        sold: 0
      },
      {
        name: 'Wireless Mouse',
        description: 'Mouse wireless ergonomis dengan DPI tinggi',
        price: 350000,
        stock: 25,
        category: 'Accessories',
        image: '/images/products/mouse.svg',
        sold: 0
      },
      {
        name: 'Mechanical Keyboard',
        description: 'Keyboard mechanical dengan RGB lighting dan switch berkualitas',
        price: 1500000,
        stock: 15,
        category: 'Accessories',
        image: '/images/products/keyboard.svg',
        sold: 0
      }
    ];

    const results = {
      created: [],
      failed: []
    };

    // Check if products already exist
    const { data: existingProducts } = await supabaseAdmin
      .from('products')
      .select('name');

    const existingNames = new Set(existingProducts?.map(p => p.name) || []);

    for (const product of products) {
      if (existingNames.has(product.name)) {
        console.log(`⏭️  Skipping ${product.name} (already exists)`);
        continue;
      }

      try {
        const { data: newProduct, error } = await supabaseAdmin
          .from('products')
          .insert([product])
          .select()
          .single();

        if (error) throw error;

        results.created.push({
          name: product.name,
          id: newProduct.id
        });
        console.log(`✅ Created: ${product.name}`);
      } catch (error) {
        results.failed.push({
          name: product.name,
          error: error.message
        });
        console.error(`❌ Failed to create ${product.name}:`, error.message);
      }
    }

    console.log('🎉 Seeding completed!\n');

    return res.status(200).json({
      success: true,
      message: 'Products seeded successfully',
      results
    });

  } catch (error) {
    console.error('❌ Seed error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: error
    });
  }
}
