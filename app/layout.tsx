import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientLayout from './ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Voice Recorder',
  description: 'Record and transcribe voice notes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-lightBg text-darkText dark:bg-darkBg dark:text-lightText min-h-screen`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
} 