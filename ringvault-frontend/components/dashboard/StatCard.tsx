interface StatCardProps { icon: string; value: string; label: string; change?: string; up?: boolean }

export function StatCard({ icon, value, label, change, up }: StatCardProps) {
  return (
    <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-4 sm:p-5 relative overflow-hidden w-full">
      <div className="text-lg sm:text-xl mb-1.5 sm:mb-2">{icon}</div>
      <div className="font-head text-lg sm:text-[22px] font-extrabold tracking-tight truncate">{value}</div>
      <div className="text-[11px] sm:text-[12px] text-[#8B92B0] mt-0.5 truncate">{label}</div>
      
      {change && (
        <div className={`mt-2 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          up ? 'bg-[rgba(34,198,122,0.15)] text-[#22C67A]' : 'bg-[rgba(247,91,91,0.15)] text-[#F75B5B]'
        }`}>
          {up ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  )
}