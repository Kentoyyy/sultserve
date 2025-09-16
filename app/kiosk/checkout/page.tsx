export default function KioskCheckoutPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Checkout</h2>
      <div className="grid grid-cols-1 gap-2">
        <button className="border rounded p-3 text-left">Pay with Cash</button>
        <button className="border rounded p-3 text-left">Pay with GCash</button>
        <button className="border rounded p-3 text-left">Pay with Card</button>
      </div>
      <a className="px-4 py-2 rounded bg-black text-white inline-block" href="/kiosk/confirmation">Confirm Order</a>
    </div>
  )
}


