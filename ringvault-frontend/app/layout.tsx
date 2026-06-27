import type { Metadata } from 'next'
import Script from 'next/script'
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
        <Script 
          src="https://js.paystack.co/v1/inline.js" 
          strategy="afterInteractive" 
        />
      </body>
    </html>
  )
}