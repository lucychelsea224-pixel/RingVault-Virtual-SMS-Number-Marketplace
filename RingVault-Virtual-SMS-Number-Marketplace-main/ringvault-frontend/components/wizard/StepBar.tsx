const STEPS = ['Country', 'State', 'Number']
export function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-end gap-0 mb-8">
      {STEPS.map((label, i) => {
        const step = i + 1
        const done   = current > step
        const active = current === step
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full border-2 grid place-items-center font-head text-[13px] font-bold transition-all ${done ? 'bg-[#22C67A] border-[#22C67A] text-white' : active ? 'bg-[#F5A623] border-[#F5A623] text-black shadow-[0_0_20px_rgba(245,166,35,0.4)]' : 'bg-[#1C2236] border-[#2A3352] text-[#5A6280]'}`}>
                {done ? '✓' : step}
              </div>
              <div className={`text-[11px] mt-1.5 font-medium ${done ? 'text-[#22C67A]' : active ? 'text-[#F5A623]' : 'text-[#5A6280]'}`}>{label}</div>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mb-6 mx-1 transition-colors ${done ? 'bg-[#22C67A]' : 'bg-[#2A3352]'}`} />}
          </div>
        )
      })}
    </div>
  )
}
