export default function KioskWelcomePage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Welcome to SulitServe</h1>
        <p>Masarap. Sulit. Mabilis.</p>
      </div>
      <a href="/kiosk/menu" className="px-6 py-4 rounded bg-black text-white text-lg">Start Order</a>
    </div>
  )
}


