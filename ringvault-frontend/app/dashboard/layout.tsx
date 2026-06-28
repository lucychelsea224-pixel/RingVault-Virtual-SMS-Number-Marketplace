'use client'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { useSession } from '@/hooks/useSession'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useSession()

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0D111A] text-white">
      {/* Sidebar handles hiding/showing via breakpoints internally */}
      <Sidebar user={user} />
      
      {/* Main viewport area 
        - Adds bottom padding on mobile screens so items don't hide behind the navbar tray
        - Removes tracking padding on desktop viewports 
      */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 md:pb-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}