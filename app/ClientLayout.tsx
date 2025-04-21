'use client'

import { RecordingProvider } from './context/RecordingContext'
import { ThemeProvider } from './context/ThemeContext'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <RecordingProvider>
        <div className="min-h-screen">
          {children}
        </div>
      </RecordingProvider>
    </ThemeProvider>
  )
} 