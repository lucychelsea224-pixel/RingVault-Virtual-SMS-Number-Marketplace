import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface AvailableNumber { phone_number: string; region: string; features: string[]; price_usd: number }
interface NumberListProps { numbers: AvailableNumber[]; loading: boolean; onBuy: (n: AvailableNumber) => void; buying: string | null }

export function NumberList({ numbers, loading, onBuy, buying }: NumberListProps) {
  if (loading) return <div className="text-center py-10 text-[#5A6280]">🔍 Searching Telnyx...</div>
  if (!numbers.length) return <div className="text-center py-10 text-[#5A6280]">No numbers found for this region.</div>

  return (
    <div className="flex flex-col gap-3">
      {numbers.map(n => (
        <div key={n.phone_number} className="flex items-center justify-between p-4 rounded-xl bg-[#1C2236] border border-[#2A3352] hover:border-[#354060] transition-colors">
          <div>
            <div className="font-head text-[15px] font-bold tracking-wide">{n.phone_number}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] text-[#5A6280]">{n.region}</span>
              {n.features.map(f => <Badge key={f} color="blue">{f}</Badge>)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-head text-[15px] font-bold">${n.price_usd.toFixed(2)}</div>
              <div className="text-[10px] text-[#5A6280]">per month</div>
            </div>
            <Button variant="accent" size="sm" loading={buying === n.phone_number} onClick={() => onBuy(n)}>
              Buy →
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
