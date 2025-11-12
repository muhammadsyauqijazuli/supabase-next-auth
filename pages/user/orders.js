import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'

export default function UserOrders() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
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
    setUser(userObj)
    loadUserOrders(token)
  }, [router])

  const loadUserOrders = async (token) => {
    try {
      const response = await fetch('/api/orders', {
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
    } catch (error) {
      console.error('Error loading orders:', error)
      alert('Gagal memuat pesanan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk memproses pesanan (user menyelesaikan pembayaran)
  // Note: Status changes should be done by admin, not user
  const processOrder = async (orderId) => {
    alert('Fitur ini akan segera hadir. Admin yang akan memproses pesanan Anda.')
    // In future: User can upload payment proof
  }

  // Fungsi untuk membatalkan pesanan
  const cancelOrder = async (orderId) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
      return
    }
    
    alert('Fitur pembatalan pesanan akan segera hadir. Hubungi admin untuk membatalkan pesanan.')
    // In future: Implement cancel order API
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
            <p className="mt-4 text-gray-600">Memuat pesanan...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Pesanan Saya</h1>
          </div>
          
          <div className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada pesanan</h3>
                <p className="text-gray-600 mb-6">Mulai berbelanja dan lihat pesanan Anda di sini</p>
                <button
                  onClick={() => router.push('/')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mulai Berbelanja
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map(order => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      {order.items && order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-50 border rounded-lg flex items-center justify-center overflow-hidden">
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name || item.name || 'Product'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.src = '/images/products/placeholder.svg' }}
                                />
                              ) : (
                                <span className="text-blue-600 font-bold text-sm">
                                  {(item.product_name || item.name || 'P').charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{item.product_name || item.name || 'Product'}</p>
                              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-medium">Rp {((item.price || 0) * (item.quantity || 0)).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <p className="text-gray-600">Total Pembayaran</p>
                      <p className="text-xl font-bold text-green-600">Rp {order.total.toLocaleString()}</p>
                    </div>

                    {/* Tombol Aksi untuk Pesanan */}
                    <div className="flex justify-end space-x-3 mt-4">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => processOrder(order.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            title="Konfirmasi pembayaran telah selesai"
                          >
                            ✓ Bayar Sekarang
                          </button>
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            ✕ Batalkan
                          </button>
                        </>
                      )}
                      {order.status === 'processing' && (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Sedang diproses oleh admin...</span>
                        </div>
                      )}
                      {order.status === 'completed' && (
                        <button
                          onClick={() => router.push('/')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          🛍️ Belanja Lagi
                        </button>
                      )}
                      {order.status === 'cancelled' && (
                        <button
                          onClick={() => router.push('/')}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          🛍️ Buat Pesanan Baru
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}