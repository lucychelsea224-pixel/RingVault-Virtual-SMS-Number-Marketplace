'use client'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { useSession } from '@/hooks/useSession'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Safe destructure with a fallback empty object
  const session = useSession() || {}
  const user = session.user || null

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0D111A] text-white">
      {/* Pass the user safely. If null, Sidebar's fallbacks will kick in without crashing */}
      <Sidebar user={user} />
      
      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 md:pb-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}