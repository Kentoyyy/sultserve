export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen flex flex-col">
      <header className="p-4 border-b text-center text-lg font-semibold">SulitServe Kiosk</header>
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">{children}</main>
    </section>
  )
}


