import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client (server-side only). Never expose key to browser.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

// Diagnostics: warn if service role missing (server-side only)
if (!supabaseAdmin && typeof window === 'undefined') {
  console.warn('[Supabase] Service role key missing. RLS-protected operations (login/email lookup, seeding) will fail unless broader SELECT/INSERT policies are enabled on users table. Set SUPABASE_SERVICE_ROLE_KEY in .env.local and restart the server.');
}

// Helper functions for database operations
export const db = {
  // Users
  users: {
    async create(user) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('users')
        .insert([user])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async findAdmins() {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('role', 'admin');
      if (error) throw error;
      return data || [];
    },
    async findByEmail(email) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();
      // PGRST116 => no row found
      // 42501 => RLS violation (no service role / policy)
      if (error) {
        if (error.code === 'PGRST116') return null;
        if (error.code === '42501') {
          // Provide clearer context for login failures
          console.error('[Supabase] RLS prevented selecting user by email. Configure SUPABASE_SERVICE_ROLE_KEY or add a broader SELECT policy for users.');
          return null; // Treat as not found for auth flow
        }
        throw error;
      }
      return data;
    },
    async findById(id) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    async update(id, updates) {
      const client = supabaseAdmin || supabase;
      
      console.log('[Supabase] Updating user:', id);
      console.log('[Supabase] Using admin client:', !!supabaseAdmin);
      console.log('[Supabase] Updates:', Object.keys(updates));
      
      const { data, error } = await client
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('[Supabase] Update failed:', error);
        throw error;
      }
      
      console.log('[Supabase] Update successful!');
      return data;
    }
  },

  // Products
  products: {
    async getAll() {
      // Products can use regular client (public read access)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('stock', 0)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async findById(id) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    async create(product) {
      // Use admin for product creation
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('products')
        .insert([product])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async updateStock(id, quantity) {
      // Use admin client to update stock
      const client = supabaseAdmin || supabase;
      
      // First get current values
      const { data: product, error: fetchError } = await client
        .from('products')
        .select('stock, sold')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Calculate new values
      const newStock = product.stock - quantity;
      const newSold = product.sold + quantity;
      
      // Update with new values
      const { data, error } = await client
        .from('products')
        .update({ 
          stock: newStock,
          sold: newSold
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Orders
  orders: {
    async create(order) {
      // Use admin client to bypass RLS (since we use JWT auth, not Supabase auth)
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('orders')
        .insert([order])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async findByUserId(userId) {
      // Use admin client for consistent access
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async getAll(status = null) {
      // Use admin client for full access to all orders
      const client = supabaseAdmin || supabase;
      let query = client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async update(id, updates) {
      // Use admin client to bypass RLS
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async getStats() {
      // Use admin client for stats
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('orders')
        .select('status, total');
      
      if (error) throw error;
      
      const stats = {
        pending: { count: 0, total: 0 },
        processing: { count: 0, total: 0 },
        completed: { count: 0, total: 0 },
        cancelled: { count: 0, total: 0 }
      };
      
      data.forEach(order => {
        if (stats[order.status]) {
          stats[order.status].count++;
          stats[order.status].total += order.total;
        }
      });
      
      return stats;
    }
  }
};
