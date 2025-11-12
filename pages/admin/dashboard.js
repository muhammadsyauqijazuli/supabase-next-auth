import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [revenue, setRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }

    const userObj = JSON.parse(userData)
    
    // Check if user is admin
    if (userObj.role !== 'admin') {
      router.push('/')
      return
    }
    
    setUser(userObj)
    loadDashboardData(token)
    
    // Auto reload setiap 5 detik untuk cek order baru
    const interval = setInterval(() => {
      loadDashboardData(token)
    }, 5000)
    
    return () => {
      clearInterval(interval)
    }
  }, [router])

  const loadDashboardData = async (token) => {
    try {
      // Load orders from API
      const response = await fetch('/api/admin/orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load orders')
      }

      // Sort by newest first
      const sortedOrders = data.orders.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
      setOrders(sortedOrders)

      // Set revenue from stats
      if (data.stats && data.stats.completed) {
        setRevenue(data.stats.completed.total || 0)
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk memproses pesanan (admin mengkonfirmasi pesanan sudah dibayar)
  const processOrder = async (orderId) => {
    if (!confirm('Konfirmasi bahwa pesanan ini sudah dibayar dan siap dikirim?')) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          status: 'completed'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order')
      }

      alert('Pesanan berhasil diselesaikan!')
      loadDashboardData(token) // Reload data
    } catch (error) {
      console.error('Error processing order:', error)
      alert('Gagal memproses pesanan: ' + error.message)
    }
  }

  // Fungsi untuk membatalkan pesanan (admin reject)
  const cancelOrder = async (orderId) => {
    const reason = prompt('Alasan pembatalan pesanan:')
    if (!reason) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          status: 'cancelled',
          cancelReason: reason
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order')
      }

      alert('Pesanan berhasil dibatalkan')
      loadDashboardData(token) // Reload data
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Gagal membatalkan pesanan: ' + error.message)
    }
  }

  // Fungsi untuk mengembalikan pesanan ke status processing
  const revertOrder = (orderId) => {
    if (!confirm('Kembalikan pesanan ini ke status diproses?')) {
      return
    }
    
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]')
    const updatedOrders = allOrders.map(order => {
      if (order.id === orderId) {
        return { 
          ...order, 
          status: 'processing',
          updatedAt: new Date().toISOString()
        }
      }
      return order
    })
    
    localStorage.setItem('orders', JSON.stringify(updatedOrders))
    loadDashboardData() // Reload data
    
    // Trigger storage event untuk sinkronisasi
    window.dispatchEvent(new Event('storage'))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Selesai'
      case 'processing': return 'Diproses'
      case 'pending': return 'Menunggu Pembayaran'
      case 'cancelled': return 'Dibatalkan'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Pemasukan</p>
                <p className="text-2xl font-bold text-gray-900">Rp {revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Pesanan</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Perlu Diproses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(order => order.status === 'processing').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-orange-600 text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pesanan Selesai</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(order => order.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pesanan Terbaru</h2>
            </div>
            <div className="p-6">
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Belum ada pesanan</p>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-sm text-gray-600">
                          {order.items.length} item • Rp {order.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        {order.status === 'processing' && (
                          <button
                            onClick={() => processOrder(order.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                            title="Selesaikan pesanan & kirim"
                          >
                            ✓ Selesai
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Performance */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Performance Produk</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {products.map(product => (
                  <div key={product.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">
                        Terjual: {product.sold} • Stok: {product.stock}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rp {product.price.toLocaleString()}</p>
                      <p className="text-sm text-green-600">
                        +Rp {(product.price * product.sold).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* All Orders Table */}
        <div className="mt-8 bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Semua Pesanan</h2>
          </div>
          <div className="p-6">
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Belum ada pesanan</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td className="px-4 py-3 text-sm">#{order.id}</td>
                        <td className="px-4 py-3 text-sm">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-2 mb-1">
                              <div className="w-8 h-8 bg-gray-50 border rounded overflow-hidden flex items-center justify-center">
                                {item.product_image ? (
                                  <img
                                    src={item.product_image}
                                    alt={item.product_name || item.name || 'Product'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = '/images/products/placeholder.svg' }}
                                  />
                                ) : (
                                  <span className="text-blue-600 text-xs font-semibold">
                                    {(item.product_name || item.name || 'P').charAt(0)}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-700">
                                {item.product_name || item.name || 'Product'} (x{item.quantity})
                              </span>
                            </div>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          Rp {order.total.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex space-x-2">
                            {order.status === 'processing' && (
                              <>
                                <button
                                  onClick={() => processOrder(order.id)}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                                  title="Konfirmasi pesanan selesai & dikirim"
                                >
                                  ✓ Selesai
                                </button>
                                <button
                                  onClick={() => cancelOrder(order.id)}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                                  title="Batalkan pesanan"
                                >
                                  ✕ Batalkan
                                </button>
                              </>
                            )}
                            {order.status === 'pending' && (
                              <span className="text-xs text-gray-500 italic">Menunggu pembayaran user</span>
                            )}
                            {order.status === 'completed' && (
                              <button
                                onClick={() => revertOrder(order.id)}
                                className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors"
                                title="Kembalikan ke status diproses"
                              >
                                ↻ Proses Ulang
                              </button>
                            )}
                            {order.status === 'cancelled' && (
                              <button
                                onClick={() => revertOrder(order.id)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                                title="Aktifkan kembali pesanan"
                              >
                                ↻ Aktifkan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}