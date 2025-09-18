'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface QRReceiptProps {
  orderNumber: string
  items: Array<{
    product: {
      id: string
      name: string
      priceCents: number
    }
    quantity: number
    size: string
  }>
  totalCents: number
  taxCents: number
  paymentMethod: string
  orderDate: string
  onClose: () => void
}

export default function QRReceipt({
  orderNumber,
  items,
  totalCents,
  taxCents,
  paymentMethod,
  orderDate,
  onClose
}: QRReceiptProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // Generate receipt data for QR code
  const receiptData = {
    orderNumber,
    items: items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.priceCents / 100,
      total: (item.product.priceCents * item.quantity) / 100
    })),
    subtotal: (totalCents - taxCents) / 100,
    tax: taxCents / 100,
    total: totalCents / 100,
    paymentMethod,
    orderDate,
    timestamp: new Date().toISOString()
  }

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrString = JSON.stringify(receiptData)
        const qrDataUrl = await QRCode.toDataURL(qrString, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrDataUrl(qrDataUrl)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    generateQR()
  }, [receiptData])

  return (
    <div className="text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Completed!</h2>
      <p className="text-slate-600 mb-6">Your order has been successfully completed</p>
      
      {/* Order Summary */}
      <div className="bg-slate-50 rounded-2xl p-6 mb-6 max-w-md mx-auto">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Order #{orderNumber}</h3>
        
        <div className="space-y-2 mb-4">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-slate-600">{item.product.name} x{item.quantity}</span>
              <span className="font-medium">₱{((item.product.priceCents * item.quantity) / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <div className="border-t border-slate-200 pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium">₱{((totalCents - taxCents) / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Tax (10%)</span>
            <span className="font-medium">₱{(taxCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
            <span>Total</span>
            <span className="text-amber-700">₱{(totalCents / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* QR Code Receipt */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 max-w-sm mx-auto">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Digital Receipt</h3>
        <p className="text-sm text-slate-600 mb-4">Scan QR code to view receipt on your phone</p>
        
        {qrDataUrl && (
          <div className="flex justify-center mb-4">
            <img src={qrDataUrl} alt="QR Code Receipt" className="w-48 h-48" />
          </div>
        )}
        
        <p className="text-xs text-slate-500">
          Payment: {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} • {orderDate}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={onClose}
          className="bg-rose-500 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-rose-600 transition-all shadow-lg hover:shadow-xl"
        >
          New Order
        </button>
        <button
          onClick={() => {
            // Download QR code as image
            if (qrDataUrl) {
              const link = document.createElement('a')
              link.download = `receipt-${orderNumber}.png`
              link.href = qrDataUrl
              link.click()
            }
          }}
          className="bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-semibold hover:bg-slate-200 transition-all"
        >
          Download Receipt
        </button>
      </div>
    </div>
  )
}





