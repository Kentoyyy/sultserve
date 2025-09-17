'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (formData: FormData) => {
    setIsLoading(true)
    setError('')
    
    const username = String(formData.get('username') || '')
    const password = String(formData.get('password') || '')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Store user info in localStorage (simple solution)
        localStorage.setItem('user', JSON.stringify(result.user))
        
        // Redirect based on role
        switch (result.user.role?.code) {
          case 'admin':
            router.push('/admin')
            break
          case 'cashier':
            router.push('/cashier')
            break
          case 'manager':
            router.push('/admin') // Managers use admin interface
            break
          default:
            router.push('/admin')
        }
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">SulitServe Café</h1>
          <p className="text-slate-600">Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form action={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Username
            </label>
            <input 
              name="username"
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input 
              name="password"
              type="password"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-slate-50 rounded-lg">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Demo Accounts:</h3>
          <div className="space-y-1 text-xs text-slate-600">
            <div>👑 <strong>Admin:</strong> admin / admin123</div>
            <div>💰 <strong>Cashier:</strong> cashier1 / cashier123</div>
            <div>👔 <strong>Manager:</strong> manager1 / manager123</div>
          </div>
        </div>
      </div>
    </div>
  )
}


