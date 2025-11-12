import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }

    const userObj = JSON.parse(userData)
    setUser(userObj)

    // Check if 2FA is already enabled (from backend/localStorage)
    setTwoFAEnabled(userObj.two_factor_enabled || false)
  }, [router])

  const setup2FA = async () => {
    // Enable 2FA via email OTP (call backend)
    setLoading(true)
    setMessage('')
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setMessage('Token tidak ditemukan. Silakan login kembali.')
        setLoading(false)
        return
      }

      console.log('🔐 Enabling 2FA with token:', token.substring(0, 20) + '...')
      
      const res = await fetch('/api/auth/simple-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'enable' })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setTwoFAEnabled(true)
        
        // Update user object in localStorage
        const userData = localStorage.getItem('user')
        if (userData) {
          const userObj = JSON.parse(userData)
          userObj.two_factor_enabled = true
          localStorage.setItem('user', JSON.stringify(userObj))
        }
        
        setMessage('2FA email OTP berhasil diaktifkan!')
      } else {
        console.error('Enable 2FA failed:', data)
        setMessage(data.error || 'Gagal mengaktifkan 2FA')
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      setMessage('Error enabling 2FA: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan 2FA? Ini akan mengurangi keamanan akun Anda.')) {
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setMessage('Token tidak ditemukan. Silakan login kembali.')
        setLoading(false)
        return
      }

      console.log('🔓 Disabling 2FA with token:', token.substring(0, 20) + '...')
      
      const res = await fetch('/api/auth/simple-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'disable' })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setTwoFAEnabled(false)
        
        // Update user object in localStorage
        const userData = localStorage.getItem('user')
        if (userData) {
          const userObj = JSON.parse(userData)
          userObj.two_factor_enabled = false
          localStorage.setItem('user', JSON.stringify(userObj))
        }
        
        setMessage('2FA telah dinonaktifkan')
      } else {
        console.error('Disable 2FA failed:', data)
        setMessage(data.error || 'Gagal menonaktifkan 2FA')
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      setMessage('Error disabling 2FA: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Saya</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Akun</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium capitalize">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status 2FA</p>
                    <p className={`font-medium ${twoFAEnabled ? 'text-green-600' : 'text-red-600'}`}>
                      {twoFAEnabled ? 'Aktif' : 'Tidak Aktif'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2FA Settings */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Keamanan Akun</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Autentikasi Dua Faktor (2FA)</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {twoFAEnabled 
                        ? '✅ 2FA email OTP sudah diaktifkan untuk akun Anda.'
                        : 'Tingkatkan keamanan akun Anda dengan mengaktifkan autentikasi dua faktor (kode OTP akan dikirim ke email setiap login).'
                      }
                    </p>
                    
                    {!twoFAEnabled ? (
                      <button
                        onClick={setup2FA}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Mempersiapkan...' : 'Aktifkan 2FA'}
                      </button>
                    ) : (
                      <button
                        onClick={disable2FA}
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Memproses...' : 'Nonaktifkan 2FA'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.includes('berhasil') || message.includes('dinonaktifkan') || message.includes('di-generate')
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}