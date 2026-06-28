const COUNTRIES = [
  { flag: '🇺🇸', name: 'United States', code: 'US', price: '$2.00' },
  { flag: '🇬🇧', name: 'United Kingdom', code: 'GB', price: '$2.00' },
  { flag: '🇨🇦', name: 'Canada',         code: 'CA', price: '$2.00' },
  { flag: '🇩🇪', name: 'Germany',        code: 'DE', price: '$2.50' },
  { flag: '🇫🇷', name: 'France',         code: 'FR', price: '$2.50' },
  { flag: '🇦🇺', name: 'Australia',      code: 'AU', price: '$2.00' },
  { flag: '🇧🇷', name: 'Brazil',         code: 'BR', price: '$3.00' },
  { flag: '🇳🇱', name: 'Netherlands',    code: 'NL', price: '$2.50' },
]

export { COUNTRIES }

interface CountryGridProps { selected: string | null; onSelect: (code: string) => void }

export function CountryGrid({ selected, onSelect }: CountryGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {COUNTRIES.map(c => (
        <button key={c.code} onClick={() => onSelect(c.code)}
          className={`relative rounded-xl p-3 text-center border-2 transition-all hover:-translate-y-0.5 ${selected === c.code ? 'border-[#F5A623] bg-[rgba(245,166,35,0.1)]' : 'border-[#2A3352] bg-[#1C2236] hover:border-[#354060]'}`}>
          {selected === c.code && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#F5A623] rounded-full text-black text-[9px] font-bold grid place-items-center">✓</span>
          )}
          <div className="text-2xl mb-1.5">{c.flag}</div>
          <div className="text-[11px] font-semibold leading-tight">{c.name}</div>
          <div className="text-[10px] text-[#5A6280] mt-1">{c.price}/mo</div>
        </button>
      ))}
    </div>
  )
}
