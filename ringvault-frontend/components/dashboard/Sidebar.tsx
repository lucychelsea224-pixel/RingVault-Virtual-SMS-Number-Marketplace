'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const NAV = [
  { href: '/dashboard',          icon: '⊞', label: 'Dashboard' },
  { href: '/dashboard/buy',      icon: '＋', label: 'Buy Number' },
  { href: '/dashboard/inbox',    icon: '✉',  label: 'SMS Inbox', badge: 3 },
  { href: '/dashboard/wallet',   icon: '◈',  label: 'Wallet' },
  { href: '/dashboard/settings', icon: '⚙',  label: 'Settings' },
]

export function Sidebar({ user }: { user: any }) {
  const path = usePathname()
  const initials = (user?.email ?? 'U').slice(0, 2).toUpperCase()

  return (
    <aside className="w-[220px] min-w-[220px] bg-[#131826] border-r border-[#2A3352] flex flex-col py-5">
      {/* Logo */}
      <div className="px-5 pb-6 mb-2 border-b border-[#2A3352] flex items-center gap-3">
        <div className="w-8 h-8 bg-[#F5A623] rounded-lg grid place-items-center text-lg flex-shrink-0">📱</div>
        <span className="font-head font-extrabold text-base tracking-tight">Ring<span className="text-[#F5A623]">Vault</span></span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col">
        {NAV.map(item => {
          const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={clsx(
              'flex items-center gap-3 px-5 py-[10px] text-[13.5px] font-medium border-l-[3px] transition-all',
              active
                ? 'border-[#F5A623] bg-[rgba(245,166,35,0.1)] text-[#F5A623]'
                : 'border-transparent text-[#8B92B0] hover:bg-[#1C2236] hover:text-[#EEF0F8]'
            )}>
              <span className="w-5 text-center text-base">{item.icon}</span>
              {item.label}
              {item.badge && <span className="ml-auto bg-[#F5A623] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="mt-auto px-5 pt-4 border-t border-[#2A3352]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F8EF7] to-[#F5A623] grid place-items-center text-[13px] font-head font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold truncate">{user?.user_metadata?.full_name ?? 'User'}</div>
            <div className="text-[11px] text-[#5A6280] truncate">{user?.email}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
