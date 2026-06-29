import Link from 'next/link'

export default function TermsPage() {
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
        <h1 className="font-head text-3xl font-extrabold mb-2">Terms & Conditions</h1>
        <p className="text-[#5A6280] text-sm mb-10">Last updated: June 2026</p>

        <div className="flex flex-col gap-8 text-[15px] leading-relaxed text-[#C8CEDF]">

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using RingVault ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our platform. RingVault reserves the right to update these terms at any time without prior notice.</p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">2. Service Description</h2>
            <p>RingVault provides virtual phone numbers for SMS and OTP verification purposes. Numbers are sourced from third-party providers including SMSPool. RingVault acts as a marketplace and is not responsible for delays, unavailability, or failures on the part of upstream SMS providers.</p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">3. Wallet & Payments</h2>
            <p>Users fund a RingVault wallet via Paystack. Wallet balances are non-refundable except in cases of verified technical failure. Charges are deducted at the point of number purchase or rental. RingVault is not responsible for payments lost due to incorrect account details provided by the user.</p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">4. Telegram Verification Notice</h2>
            <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-xl p-4 text-[#F5A623]">
              <p className="font-semibold mb-1">⚠️ Important Notice for Telegram Users</p>
              <p className="text-[#EEF0F8] text-[14px]">Telegram requires a physical SIM-based mobile device for new account registration. Attempting to verify a Telegram account using a virtual number may fail. Additionally, SMSPool charges a premium rate for Telegram SMS verification. RingVault passes this cost to the user — Telegram verifications are charged at <strong className="text-[#F5A623]">₦2,030</strong> per attempt. This charge is non-refundable if the SMS is delivered but registration fails on Telegram's end.</p>
            </div>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">5. Prohibited Use</h2>
            <p>You may not use RingVault to:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li>Create fake or fraudulent accounts on any platform</li>
              <li>Engage in spam, phishing, or any form of fraud</li>
              <li>Violate the terms of service of any third-party platform</li>
              <li>Use numbers for illegal activities under applicable law</li>
              <li>Resell or redistribute RingVault services without written permission</li>
            </ul>
            <p className="mt-3">Violation of these rules will result in immediate account suspension without refund.</p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">6. Refund Policy</h2>
            <p>Refunds are only issued when a number purchase fails <strong>before</strong> a number is allocated and the wallet was charged. If a number is allocated and the SMS is not received due to the third-party provider's limitations, a partial credit may be issued at RingVault's discretion. Resend requests ($0.75) are non-refundable.</p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">7. Limitation of Liability</h2>
            <p>RingVault is not liable for any direct, indirect, incidental, or consequential damages arising from use of the Service. The platform is provided "as is" without warranty of any kind. Your use of the Service is at your sole risk.</p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">8. Account Termination</h2>
            <p>RingVault reserves the right to suspend or terminate any account at any time for violation of these terms or for any other reason deemed appropriate, with or without notice.</p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-[17px] mb-3">9. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:support@ringvault.io" className="text-[#F5A623] hover:underline">support@ringvault.io</a></p>
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
