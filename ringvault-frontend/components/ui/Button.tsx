import { clsx } from 'clsx'
type Variant = 'accent' | 'ghost' | 'danger' | 'green'
type Size = 'sm' | 'md' | 'lg'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: Size; loading?: boolean }
const v: Record<Variant, string> = {
  accent: 'bg-[#F5A623] text-black hover:bg-[#E8891A]',
  ghost:  'bg-[#1C2236] text-[#EEF0F8] border border-[#2A3352] hover:border-[#354060] hover:bg-[#242B42]',
  danger: 'bg-[rgba(247,91,91,0.12)] text-[#F75B5B] border border-[rgba(247,91,91,0.3)]',
  green:  'bg-[rgba(34,198,122,0.12)] text-[#22C67A] border border-[rgba(34,198,122,0.3)]',
}
const s: Record<Size, string> = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }
export function Button({ variant = 'ghost', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button {...props} disabled={disabled || loading} className={clsx('inline-flex items-center gap-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed', v[variant], s[size], className)}>
      {loading ? '⏳' : children}
    </button>
  )
}
