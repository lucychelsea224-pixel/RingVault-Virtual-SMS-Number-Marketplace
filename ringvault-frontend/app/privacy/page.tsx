import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <nav className="flex items-center justify-between px-6 sm:px-12 py-5 border-b border-[#2A3352]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#F5A623] rounded-xl grid place-items-center text-xl">📱</div>
          <span className="font-head font-extrabold text-lg">Ring<span className="text-[#F5A623]">Vault</span></span>
        </Link>
        <Link href="/auth/login" className="text-[13px] text-[#8B92B0] hover:text-white font-semibold">Sign In</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="font-head text-3xl font-extrabold mb-2">Privacy Policy</h1>
        <p className="text-[#5A6280] text-sm mb-10">Last updated: June 2026</p>

        <div className="flex flex-col gap-8 text-[15px] leading-relaxed text-[#C8CEDF]">

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">1. Information We Collect</h2>
            <p>When you use RingVault, we collect the following:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li><strong className="text-white">Account information</strong> — name, email address, and optional phone number provided during signup</li>
              <li><strong className="text-white">Transaction data</strong> — wallet top-ups, number purchases, and SMS activity</li>
              <li><strong className="text-white">Usage data</strong> — pages visited, features used, and time of activity</li>
              <li><strong className="text-white">Payment data</strong> — processed securely through Paystack; RingVault does not store card details</li>
            </ul>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li>Provide and maintain the RingVault service</li>
              <li>Process wallet payments and number purchases</li>
              <li>Deliver SMS messages and OTP codes to your dashboard</li>
              <li>Send account-related notifications</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Improve the platform based on usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">3. SMS Data</h2>
            <p>SMS messages received on your virtual numbers are stored temporarily in your dashboard to allow you to view OTP codes. Messages are linked to your account and are not shared with any third parties. You may clear your message history at any time from your dashboard.</p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">4. Data Security</h2>
            <p>We take data security seriously. Your data is stored using Supabase with row-level security enabled. Passwords are hashed and never stored in plain text. All API communication is encrypted via HTTPS. However, no system is 100% secure and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">5. Cookies</h2>
            <p>RingVault uses cookies only for authentication purposes. We do not use tracking or advertising cookies. You can disable cookies in your browser, but this may prevent you from signing in.</p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent at any time by deleting your account</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at <a href="mailto:support@ringvault.io" className="text-[#F5A623] hover:underline">support@ringvault.io</a></p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">7. Children's Privacy</h2>
            <p>RingVault is not intended for users under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has created an account, we will delete it immediately.</p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify users of significant changes via email or a notice on the platform. Continued use of RingVault after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">9. Contact</h2>
            <p>For privacy-related questions, contact us at <a href="mailto:support@ringvault.io" className="text-[#F5A623] hover:underline">support@ringvault.io</a></p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#2A3352] px-6 py-6 text-center text-[12px] text-[#5A6280]">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/terms" className="hover:text-white">Terms & Conditions</Link>
          <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
        </div>
        2026 RingVault. All rights reserved.
      </footer>
    </div>
  )
}
