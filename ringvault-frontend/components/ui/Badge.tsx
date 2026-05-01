import { clsx } from 'clsx'
type Color = 'blue' | 'green' | 'accent' | 'red' | 'gray'
const c: Record<Color, string> = {
  blue: 'bg-[rgba(79,142,247,0.15)] text-[#4F8EF7]', green: 'bg-[rgba(34,198,122,0.15)] text-[#22C67A]',
  accent: 'bg-[rgba(245,166,35,0.15)] text-[#F5A623]', red: 'bg-[rgba(247,91,91,0.15)] text-[#F75B5B]',
  gray: 'bg-[#242B42] text-[#8B92B0]',
}
export function Badge({ color = 'gray', children, className }: { color?: Color; children: React.ReactNode; className?: string }) {
  return <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', c[color], className)}>{children}</span>
}
