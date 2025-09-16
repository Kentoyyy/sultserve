export default function KioskConfirmationPage() {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-semibold">Order Placed!</h2>
      <p>Your order number is <span className="font-mono">#1234</span></p>
      <p>Now serving queue will update shortly.</p>
      <a className="px-4 py-2 rounded bg-black text-white inline-block" href="/kiosk">New Order</a>
    </div>
  )
}


