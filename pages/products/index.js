import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import SearchBar from '../../components/SearchBar'
import Loading from '../../components/Loading'
import Toast from '../../components/Toast'

export default function Products() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
        return
      }

      const data = await response.json()
      
      if (data.success) {
        setProducts(data.products)
        setFilteredProducts(data.products)
      } else {
        showToast(data.error || 'Gagal memuat produk', 'error')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      showToast('Terjadi kesalahan saat memuat produk', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    
    if (!term.trim()) {
      setFilteredProducts(products)
      return
    }

    const searchLower = term.toLowerCase()
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower)
    )
    
    setFilteredProducts(filtered)
  }

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price)
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Semua Produk
          </h1>
          <p className="text-gray-600">
            Temukan produk yang Anda cari
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Cari berdasarkan nama, deskripsi, atau kategori..."
          />
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mb-4 text-gray-600">
            {filteredProducts.length > 0 ? (
              <p>
                Ditemukan <span className="font-semibold">{filteredProducts.length}</span> produk 
                untuk "<span className="font-semibold">{searchTerm}</span>"
              </p>
            ) : (
              <p>
                Tidak ada produk yang sesuai dengan "<span className="font-semibold">{searchTerm}</span>"
              </p>
            )}
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-200">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Stock Badge */}
                  {product.stock > 0 ? (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      Stok: {product.stock}
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      Habis
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  {/* Category */}
                  {product.category && (
                    <p className="text-xs text-blue-600 font-semibold mb-1 uppercase">
                      {product.category}
                    </p>
                  )}
                  
                  {/* Name */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(product.price)}
                    </span>
                    
                    {/* Add to Cart Button */}
                    <button
                      onClick={() => showToast('Fitur keranjang akan segera hadir!', 'info')}
                      disabled={product.stock === 0}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        product.stock > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {product.stock > 0 ? 'Beli' : 'Habis'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Produk tidak ditemukan
            </h3>
            <p className="text-gray-500 mb-4">
              Coba gunakan kata kunci lain atau hapus filter pencarian
            </p>
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Lihat Semua Produk
              </button>
            )}
          </div>
        )}
      </main>

      {toast.show && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
