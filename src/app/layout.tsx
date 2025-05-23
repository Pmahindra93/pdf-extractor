import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bank Statement Analyzer',
  description: 'Analyze bank statements and extract key information',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* Toaster temporarily disabled to test hydration */}
      </body>
    </html>
  )
}
