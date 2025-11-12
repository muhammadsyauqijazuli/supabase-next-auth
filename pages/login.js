import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Loading from '../components/Loading'
import Toast from '../components/Toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [twoFACode, setTwoFACode] = useState('')
  const [tempToken, setTempToken] = useState(null)
  const [tempUser, setTempUser] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [devOTP, setDevOTP] = useState(null) // Store OTP for development mode
  const router = useRouter()

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/dashboard')
    }
  }, [])

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validasi input
    if (!email || !password) {
      setError('Email dan password harus diisi')
      setLoading(false)
      return
    }

    try {
      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.requires2FA) {
        // Show 2FA input
        setTempToken(data.tempToken)
        setTempUser(data.user)
        setShow2FA(true)
        
        // Send email OTP automatically
        if (data.twoFAMethod === 'email') {
          showToastMessage('Mengirim kode OTP ke email Anda...', 'info')
          
          // Call API to send OTP
          try {
            const otpResponse = await fetch('/api/auth/email-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'send',
                tempToken: data.tempToken
              })
            })
            
            const otpData = await otpResponse.json()
            
            if (otpResponse.ok) {
              // In development, show OTP in alert
              if (otpData.devOTP) {
                setDevOTP(otpData.devOTP) // Store for display in UI
                // Show in toast with longer duration
                showToastMessage(`🔐 DEV MODE - Kode OTP: ${otpData.devOTP}`, 'info')
                console.log('🔐 OTP Code:', otpData.devOTP)
                
                // Also show in alert for visibility
                setTimeout(() => {
                  alert(`🔐 DEVELOPMENT MODE\n\nKode OTP Anda: ${otpData.devOTP}\n\nMasukkan kode ini untuk login.`)
                }, 500)
              } else {
                showToastMessage('Kode OTP telah dikirim ke email Anda', 'success')
              }
            } else {
              showToastMessage('Gagal mengirim OTP. Silakan coba lagi.', 'error')
            }
          } catch (otpError) {
            console.error('Failed to send OTP:', otpError)
          }
        } else {
          showToastMessage('Masukkan kode 2FA Anda', 'info')
        }
      } else {
        // Login successful without 2FA
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        showToastMessage('Login berhasil!', 'success')
        
        // Redirect based on role
        setTimeout(() => {
          if (data.user.role === 'admin') {
            router.push('/admin/dashboard')
          } else {
            router.push('/dashboard')
          }
        }, 500)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(error.message || 'Login gagal. Silakan cek email dan password Anda.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!twoFACode || twoFACode.length < 6) {
      setError('Kode OTP harus 6 digit')
      setLoading(false)
      return
    }

    try {
      // Call email-otp verify API
      const response = await fetch('/api/auth/email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          tempToken,
          code: twoFACode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verifikasi OTP gagal')
      }

      // Save token and user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      showToastMessage('Verifikasi OTP berhasil!', 'success')

      // Redirect based on role
      setTimeout(() => {
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      }, 500)
    } catch (error) {
      console.error('2FA verification error:', error)
      setError(error.message || 'Kode 2FA tidak valid')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      {loading && <Loading />}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {show2FA ? 'Verifikasi Email OTP' : 'Login ke Akun Anda'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {show2FA
              ? 'Masukkan kode 6-digit yang dikirim ke email Anda'
              : 'E-commerce dengan autentikasi dua faktor'}
          </p>
        </div>

        {!show2FA ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a
                  href="/register"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Belum punya akun? Daftar
                </a>
              </div>
              <div className="text-sm">
                <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Kembali ke Home
                </a>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-semibold mb-2">Demo Accounts:</p>
              <div className="space-y-2 text-xs text-blue-700">
                <div className="bg-white p-2 rounded">
                  <strong>Admin:</strong> admin@example.com / admin123
                </div>
                <div className="bg-white p-2 rounded">
                  <strong>User:</strong> user@example.com / user123
                </div>
              </div>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerify2FA}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📧 Kode OTP 6-digit telah dikirim ke email Anda.
                Masukkan kode tersebut di bawah ini.
              </p>
            </div>

            {/* Development Mode: Show OTP directly */}
            {devOTP && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                <p className="text-sm font-bold text-yellow-900 mb-2">
                  🔐 DEVELOPMENT MODE
                </p>
                <p className="text-xs text-yellow-800 mb-2">
                  Kode OTP Anda (hanya muncul di development):
                </p>
                <p className="text-3xl font-bold text-center text-yellow-900 tracking-widest">
                  {devOTP}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="code" className="sr-only">
                Kode OTP Email
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                maxLength={8}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center tracking-widest text-2xl"
                placeholder="000000"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShow2FA(false)
                  setTwoFACode('')
                  setError('')
                }}
                className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
