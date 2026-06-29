'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col">
      <nav className="flex items-center justify-between px-6 sm:px-12 py-5 border-b border-[#2A3352]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#F5A623] rounded-xl grid place-items-center text-xl">📱</div>
          <span className="font-head font-extrabold text-lg tracking-tight">Ring<span className="text-[#F5A623]">Vault</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-[13px] text-[#8B92B0] hover:text-white font-semibold transition-colors px-3 py-1.5">Sign In</Link>
          <Link href="/auth/signup" className="text-[13px] bg-[#F5A623] hover:bg-[#E8891A] text-black font-bold px-4 py-2 rounded-lg transition-all">Get Started</Link>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 bg-[#1C2236] border border-[#2A3352] rounded-full px-4 py-1.5 text-[12px] text-[#F5A623] font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
          Live SMS Numbers Available Now
        </div>
        <h1 className="font-head font-extrabold text-4xl sm:text-5xl md:text-6xl leading-tight mb-6 max-w-3xl">
          Virtual Numbers for<br /><span className="text-[#F5A623]">SMS Verification</span>
        </h1>
        <p className="text-[#8B92B0] text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
          Buy or rent real virtual phone numbers from the USA and worldwide. Receive OTP codes instantly for any app.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/auth/signup" className="px-8 py-3.5 bg-[#F5A623] hover:bg-[#E8891A] text-black font-head font-bold text-base rounded-xl transition-all">Start for Free →</Link>
          <Link href="/auth/login" className="px-8 py-3.5 bg-[#1C2236] hover:bg-[#242B42] border border-[#2A3352] text-white font-semibold text-base rounded-xl transition-all">Sign In</Link>
        </div>
      </section>

      <section className="px-4 sm:px-12 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '⚡', title: 'Instant Activation', desc: 'Get a real number in seconds. OTP codes arrive automatically.' },
            { icon: '🌍', title: 'Global Coverage', desc: 'Numbers from USA, UK, Germany, France, India and more.' },
            { icon: '🔒', title: 'Secure & Private', desc: 'No personal number needed. Stay anonymous and protected.' },
          ].map(f => (
            <div key={f.title} className="bg-[#131826] border border-[#2A3352] rounded-2xl p-6">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-head font-bold text-[15px] mb-2">{f.title}</h3>
              <p className="text-[13px] text-[#8B92B0] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-12 pb-24 max-w-5xl mx-auto w-full">
        <h2 className="font-head font-bold text-2xl text-center mb-8">Simple Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="bg-[#131826] border border-[#2A3352] rounded-2xl p-6">
            <div className="text-[#F5A623] font-head font-bold text-xl mb-1">$2.00</div>
            <div className="font-bold text-[15px] mb-2">One-Time Code</div>
            <p className="text-[13px] text-[#8B92B0]">Perfect for a single verification. Number active for 15 minutes.</p>
          </div>
          <div className="bg-[#131826] border border-[#F5A623]/30 rounded-2xl p-6 relative">
            <div className="absolute top-3 right-3 bg-[#F5A623] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">POPULAR</div>
            <div className="text-[#F5A623] font-head font-bold text-xl mb-1">$4.00</div>
            <div className="font-bold text-[15px] mb-2">Long-Term Rental</div>
            <p className="text-[13px] text-[#8B92B0]">Keep a number for days or weeks. Great for multiple verifications.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#2A3352] px-6 py-8 text-center text-[12px] text-[#5A6280]">
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <a href="mailto:support@ringvault.io" className="hover:text-white transition-colors">Contact Us</a>
        </div>
        2026 RingVault. All rights reserved.
      </footer>
    </div>
  )
}
