interface StatCardProps { icon: string; value: string; label: string; change?: string; up?: boolean }
export function StatCard({ icon, value, label, change, up }: StatCardProps) {
  return (
    <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-5 relative overflow-hidden">
      <div className="text-xl mb-2">{icon}</div>
      <div className="font-head text-[22px] font-extrabold tracking-tight">{value}</div>
      <div className="text-[12px] text-[#8B92B0] mt-0.5">{label}</div>
      {change && (
        <div className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-[rgba(34,198,122,0.15)] text-[#22C67A]' : 'bg-[rgba(247,91,91,0.15)] text-[#F75B5B]'}`}>
          {up ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  )
}
