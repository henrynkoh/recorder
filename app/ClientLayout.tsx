'use client'

import { RecordingProvider } from './context/RecordingContext'
import { ThemeProvider } from './context/ThemeContext'
import { SettingsProvider } from './context/SettingsContext'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <RecordingProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </RecordingProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
} 