import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B0E17] text-white flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-6">
        <span className="font-bold text-lg tracking-wide">◈ RingVault</span>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-[#8B92B0] hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="bg-[#F5A623] text-black text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-6">
        <h1 className="text-3xl sm:text-5xl font-bold max-w-2xl">
          Virtual numbers for SMS &amp; OTP verification, in seconds.
        </h1>
        <p className="text-[#8B92B0] max-w-md text-sm sm:text-base">
          Buy USA and international virtual phone numbers, receive verification
          codes in real time, all from one dashboard.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Link
            href="/auth/signup"
            className="bg-[#F5A623] text-black font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Create an account
          </Link>
          <Link
            href="/auth/login"
            className="border border-[#2A3352] px-6 py-3 rounded-lg hover:border-[#5A6280] transition-colors"
          >
            I already have an account
          </Link>
        </div>
      </main>
    </div>
  )
}
