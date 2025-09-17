'use client'

import { useRouter } from 'next/navigation'

export default function KioskWelcomePage() {
  const router = useRouter()

  const startOrder = () => {
    router.push('/kiosk/menu')
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center">
          <div className="w-10 h-10 bg-amber-700 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">SulitServe Café</h1>
            <p className="text-sm text-slate-500">Self-Service Kiosk</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-amber-700 text-3xl">☕</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Welcome</h2>
            <p className="text-lg text-slate-600 mb-2">Ready to order?</p>
            <p className="text-sm text-slate-500">Fresh coffee, delicious treats, great prices</p>
          </div>
          
          <button 
            onClick={startOrder}
            className="w-full bg-amber-600 text-white py-4 px-8 rounded-xl text-lg font-semibold hover:bg-amber-700 transition-colors shadow-sm border border-amber-600 hover:border-amber-700"
          >
            Start Your Order
          </button>
          
          <p className="text-xs text-slate-400 mt-6">Touch the button above to begin ordering</p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 px-8 py-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-slate-400">Masarap. Sulit. Mabilis.</p>
        </div>
      </div>
    </div>
  )
}


