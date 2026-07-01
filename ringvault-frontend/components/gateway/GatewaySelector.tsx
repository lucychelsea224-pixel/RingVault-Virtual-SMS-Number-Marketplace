'use client'

import { useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { useGateway } from '@/hooks/useGateway'

const GATEWAYS = [
  { id: 'gatewayA', label: 'Gateway A', desc: 'Fast activation · Global coverage' },
  { id: 'gatewayB', label: 'Gateway B', desc: 'High availability · Wide service list' },
  { id: 'gatewayC', label: 'Gateway C', desc: 'Premium numbers · Low latency' },
  { id: 'gatewayD', label: 'Gateway D', desc: 'Budget-friendly · USA focus' },
  { id: 'gatewayE', label: 'Gateway E', desc: 'European coverage · Reliable' },
  { id: 'gatewayF', label: 'Gateway F', desc: 'Broad service support · Stable' },
]

const SERVICES = [
  'telegram','whatsapp','google','facebook','instagram','twitter',
  'tiktok','discord','uber','amazon','netflix','snapchat',
  'tinder','linkedin','steam','paypal','openai',
]

interface Props {
  country?: string
}

export function GatewaySelector({ country = '1' }: Props) {
  const { token } = useSession()
  const { state, fetchNumber, cancelOrder, reset } = useGateway(token)

  const [selectedGateway, setSelectedGateway] = useState('gatewayA')
  const [selectedService, setSelectedService] = useState('telegram')

  const handleFetch = () => {
    fetchNumber(selectedGateway, selectedService, country)
  }

  return (
    <div className="w-full flex flex-col gap-5">

      {/* Gateway picker */}
      {state.status === 'IDLE' || state.status === 'ERROR' ? (
        <>
          <div>
            <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-2">
              Select Gateway
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GATEWAYS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGateway(g.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedGateway === g.id
                      ? 'border-[#F5A623] bg-[#F5A623]/10'
                      : 'border-[#2A3352] bg-[#1C2236] hover:border-[#354060]'
                  }`}
                >
                  <div className="font-head font-bold text-[13px]">{g.label}</div>
                  <div className="text-[10px] text-[#5A6280] mt-0.5">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-2">
              Service
            </label>
            <select
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
              className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none focus:border-[#F5A623]"
            >
              {SERVICES.map(s => (
                <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {state.error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[13px]">
              {state.error}
            </div>
          )}

          <button
            onClick={handleFetch}
            className="w-full py-3 bg-[#F5A623] hover:bg-[#E8891A] text-black font-head font-bold rounded-xl transition-all"
          >
            Get Number →
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-4">

          {/* Phone display */}
          <div className="bg-[#1C2236] border border-[#2A3352] rounded-xl p-5 flex flex-col items-center gap-2">
            <span className="text-[11px] text-[#8B92B0] uppercase font-semibold tracking-wider">Your Number</span>
            <span className="text-2xl font-mono font-bold text-[#EEF0F8] tracking-widest select-all">
              {state.phone ?? '—'}
            </span>
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#1C2236] border border-[#2A3352] text-[#5A6280]">
              {selectedGateway.toUpperCase()} · {selectedService}
            </span>
          </div>

          {/* Status */}
          {state.status === 'LOADING' && (
            <div className="flex items-center gap-3 p-4 bg-[#1C2236] rounded-xl border border-[#2A3352]">
              <div className="w-2 h-2 rounded-full bg-[#F5A623] animate-ping" />
              <span className="text-[13px] text-[#8B92B0]">Allocating number from provider...</span>
            </div>
          )}

          {state.status === 'PENDING' && (
            <div className="flex items-center gap-3 p-4 bg-[#1C2236] rounded-xl border border-[#2A3352]">
              <div className="w-2 h-2 rounded-full bg-[#F5A623] animate-ping" />
              <span className="text-[13px] text-[#8B92B0]">Waiting for SMS verification code...</span>
            </div>
          )}

          {state.status === 'RECEIVED' && (
            <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-xl flex flex-col items-center gap-2">
              <span className="text-[11px] text-[#5A6280] uppercase font-semibold">Verification Code</span>
              <span className="text-4xl font-mono font-extrabold text-[#22C67A] tracking-[6px] select-all">
                {state.code}
              </span>
            </div>
          )}

          {state.status === 'EXPIRED' && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[13px]">
              {state.error || 'Number expired. No code was received.'}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {(state.status === 'PENDING') && (
              <button
                onClick={cancelOrder}
                className="flex-1 py-2.5 text-[12px] font-bold rounded-xl border border-[#4F8EF7]/40 text-[#4F8EF7] hover:bg-[#4F8EF7]/10 transition-all"
              >
                💰 Cancel & Refund
              </button>
            )}
            <button
              onClick={reset}
              className="flex-1 py-2.5 text-[12px] font-bold rounded-xl border border-[#2A3352] text-[#8B92B0] hover:border-[#354060] transition-all"
            >
              ← New Request
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
