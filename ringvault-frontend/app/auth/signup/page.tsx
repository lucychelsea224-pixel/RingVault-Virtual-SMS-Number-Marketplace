'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      setSuccess(true)
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] grid place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#F5A623] rounded-xl grid place-items-center text-2xl mx-auto mb-4">📱</div>
          <h1 className="font-head text-2xl font-extrabold">Ring<span className="text-[#F5A623]">Vault</span></h1>
          <p className="text-[#8B92B0] text-sm mt-1">Create your account</p>
        </div>
        <form onSubmit={handleSignup} className="bg-[#131826] border border-[#2A3352] rounded-2xl p-7">
          {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[13px]">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-[13px]">Account created! Redirecting...</div>}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-1.5">Full Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none focus:border-[#F5A623] transition-colors" />
          </div>
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-1.5">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none focus:border-[#F5A623] transition-colors" />
          </div>
          <div className="mb-6">
            <label className="block text-[11px] font-semibold text-[#8B92B0] uppercase tracking-wide mb-1.5">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#1C2236] border border-[#2A3352] rounded-lg px-4 py-2.5 text-[14px] text-[#EEF0F8] outline-none focus:border-[#F5A623] transition-colors" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#F5A623] hover:bg-[#E8891A] disabled:opacity-50 text-black font-head font-bold text-[15px] py-3 rounded-xl transition-all">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p className="text-center text-[13px] text-[#8B92B0] mt-5">
            Have an account? <Link href="/auth/login" className="text-[#F5A623] hover:underline font-semibold">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
