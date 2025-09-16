export default function KioskMenuPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Menu</h2>
      <div className="grid grid-cols-2 gap-3">
        <a className="border rounded p-4" href="/kiosk/customize?item=coffee">Coffee ☕</a>
        <a className="border rounded p-4" href="/kiosk/customize?item=milktea">Milk Tea 🧋</a>
        <a className="border rounded p-4" href="/kiosk/customize?item=fries">Fries 🍟</a>
        <a className="border rounded p-4" href="/kiosk/customize?item=snacks">Snacks 🍔</a>
      </div>
    </div>
  )
}


