import type { Metadata } from 'next'
import Script from 'next/script' // 1. Import Script
import './globals.css'
import { ThemeProvider } from '@/components/ui/ThemeProvider'

export const metadata: Metadata = {
  title: 'RingVault – Virtual SMS Numbers',
  description: 'Buy USA & International virtual numbers for SMS verification',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        {/* 2. Use the Script component instead of <head><script /></head> */}
        <Script 
          src="https://js.paystack.co/v1/inline.js" 
          strategy="afterInteractive" 
        />
      </body>
    </html>
  )
}