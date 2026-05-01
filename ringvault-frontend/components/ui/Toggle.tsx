'use client'
export function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative w-10 h-[22px] rounded-full border transition-colors duration-200 ${on ? 'bg-[#F5A623] border-[#F5A623]' : 'bg-[#242B42] border-[#2A3352]'}`}>
      <span className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-[18px]' : ''}`} />
    </button>
  )
}
