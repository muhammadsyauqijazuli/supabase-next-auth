import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import SearchBar from '../components/SearchBar'

export default function Home() {
    const [products, setProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [cart, setCart] = useState([])
    const [showCart, setShowCart] = useState(false)
    const [user, setUser] = useState(null)
    const [mounted, setMounted] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()

    useEffect(() => {
        setMounted(true)

        // Check if user is logged in
        const token = localStorage.getItem('token')
        if (token) {
            const userData = localStorage.getItem('user')
            if (userData) {
                setUser(JSON.parse(userData))
            }
        }

        // Load products from API
        loadProducts()
    }, [])

    const loadProducts = async () => {
        try {
            const response = await fetch('/api/products')
            const data = await response.json()

            if (response.ok && data.products) {
                setProducts(data.products)
                setFilteredProducts(data.products)
            } else {
                console.error('Failed to load products:', data.error)
                // Fallback to sample data if API fails
                loadSampleProducts()
            }
        } catch (error) {
            console.error('Error loading products:', error)
            // Fallback to sample data
            loadSampleProducts()
        }
    }

    const loadSampleProducts = () => {
        // Sample products data as fallback
        const sampleProducts = [
            {
                id: 'sample-1',
                name: 'Laptop Gaming',
                description: 'Laptop gaming dengan spesifikasi tinggi untuk pengalaman bermain optimal',
                price: 15000000,
                image: '/images/products/laptop.svg',
                stock: 10,
                category: 'electronics'
            },
            {
                id: 'sample-2',
                name: 'Smartphone Flagship',
                description: 'Smartphone terbaru dengan kamera canggih dan performa maksimal',
                price: 8000000,
                image: '/images/products/smartphone.svg',
                stock: 15,
                category: 'electronics'
            },
            {
                id: 'sample-3',
                name: 'Headphone Wireless',
                description: 'Headphone dengan teknologi noise cancellation dan konektivitas Bluetooth',
                price: 1200000,
                image: '/images/products/headphone.svg',
                stock: 20,
                category: 'audio'
            },
            {
                id: 'sample-4',
                name: 'Smart Watch',
                description: 'Jam tangan pintar dengan fitur kesehatan dan notifikasi smartphone',
                price: 2500000,
                image: '/images/products/smartwatch.svg',
                stock: 8,
                category: 'wearables'
            },
            {
                id: 'sample-5',
                name: 'Tablet Android',
                description: 'Tablet dengan layar besar cocok untuk bekerja dan hiburan',
                price: 4500000,
                image: '/images/products/tablet.svg',
                stock: 12,
                category: 'electronics'
            },
            {
                id: 'sample-6',
                name: 'Kamera DSLR',
                description: 'Kamera profesional untuk fotografi dengan kualitas gambar terbaik',
                price: 12000000,
                image: '/images/products/camera.svg',
                stock: 5,
                category: 'photography'
            }
        ]
        setProducts(sampleProducts)
        setFilteredProducts(sampleProducts)
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

    const addToCart = (product) => {
        if (product.stock === 0) {
            alert('Stok produk habis')
            return
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                if (existing.quantity >= product.stock) {
                    alert('Stok tidak mencukupi')
                    return prev
                }
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { ...product, quantity: 1 }]
        })
    }

    const Cart = ({ cart, setCart, onClose }) => {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        const updateQuantity = (id, quantity) => {
            if (quantity === 0) {
                setCart(cart.filter(item => item.id !== id))
            } else {
                const product = products.find(p => p.id === id)
                if (quantity > product.stock) {
                    alert('Stok tidak mencukupi')
                    return
                }
                setCart(cart.map(item =>
                    item.id === id ? { ...item, quantity } : item
                ))
            }
        }

    const checkout = async () => {
        if (!user) {
            alert('Silakan login terlebih dahulu')
            router.push('/login')
            return
        }

        if (cart.length === 0) {
            alert('Keranjang belanja kosong')
            return
        }

        try {
            // Get token
            const token = localStorage.getItem('token')
            if (!token) {
                alert('Sesi login telah habis. Silakan login kembali.')
                router.push('/login')
                return
            }

            // Prepare order data for API
            const orderData = {
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity
                })),
                total: total,
                paymentProof: `TRANSFER-${Date.now()}`,
                autoComplete: true // Langsung tandai pesanan selesai saat bayar
            }

            // Call API to create order
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Checkout gagal')
            }

            // Success - clear cart and update product stock
            const updatedProducts = products.map(product => {
                const cartItem = cart.find(item => item.id === product.id)
                if (cartItem) {
                    return {
                        ...product,
                        stock: product.stock - cartItem.quantity
                    }
                }
                return product
            })
            setProducts(updatedProducts)
            
            // Show success message
            alert(`Pesanan berhasil dibuat!\n\nOrder ID: #${data.order.id.substring(0, 8)}\nTotal: Rp ${total.toLocaleString()}\n\nSilakan cek halaman Pesanan Saya.`)
            
            // Clear cart and close modal
            setCart([])
            setShowCart(false)
            
            // Redirect ke halaman orders
            router.push('/user/orders')

        } catch (error) {
            console.error('Checkout error:', error)
            alert('Checkout gagal: ' + error.message)
        }
    }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Keranjang Belanja</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    {cart.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Keranjang kosong</p>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center border-b pb-2">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-gray-600">Rp {item.price.toLocaleString()} x {item.quantity}</p>
                                            <p className="text-xs text-gray-500">Stok: {item.stock}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 border-t pt-4">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total:</span>
                                    <span>Rp {total.toLocaleString()}</span>
                                </div>
                                <button
                                    onClick={checkout}
                                    className="w-full bg-green-600 text-white py-3 rounded-lg mt-4 hover:bg-green-700"
                                >
                                    Checkout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )
    }

    const ProductCard = ({ product, onAddToCart }) => {
        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                            e.target.src = '/images/products/placeholder.svg'
                        }}
                    />
                </div>
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">{product.name}</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                            {product.category}
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-500">Stok: {product.stock}</span>
                        {product.stock === 0 && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Habis</span>
                        )}
                        {product.stock > 0 && product.stock <= 5 && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Terbatas</span>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-gray-900">
                            Rp {product.price?.toLocaleString() || '0'}
                        </span>
                        <button
                            onClick={() => onAddToCart(product)}
                            disabled={product.stock === 0}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Keranjang</span>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Tampilkan loading sampai komponen mounted
    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                                <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                                <div className="flex justify-between items-center">
                                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                    <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Selamat Datang di TokoOnline</h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                        Temukan produk terbaik dengan kualitas terjamin dan harga terjangkau
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <SearchBar 
                        onSearch={handleSearch}
                        placeholder="Cari produk, kategori, atau deskripsi..."
                    />
                </div>

                {/* Search Results Info */}
                {searchTerm && (
                    <div className="mb-6 text-center text-gray-600">
                        {filteredProducts.length > 0 ? (
                            <p>
                                Ditemukan <span className="font-semibold">{filteredProducts.length}</span> produk 
                                untuk "<span className="font-semibold">{searchTerm}</span>"
                            </p>
                        ) : (
                            <div>
                                <p className="mb-4">
                                    Tidak ada produk yang sesuai dengan "<span className="font-semibold">{searchTerm}</span>"
                                </p>
                                <button
                                    onClick={() => handleSearch('')}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Lihat Semua Produk
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={addToCart}
                        />
                    ))}
                </div>
            </main>

            {showCart && (
                <Cart cart={cart} setCart={setCart} onClose={() => setShowCart(false)} />
            )}

            {/* Floating Cart Button */}
            {cart.length > 0 && (
                <button
                    onClick={() => setShowCart(true)}
                    className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
                >
                    <div className="flex items-center">
                        <span className="mr-2">🛒</span>
                        <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            {cart.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                    </div>
                </button>
            )}
        </div>
    )
}