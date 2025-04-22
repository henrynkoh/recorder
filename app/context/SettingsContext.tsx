'use client'

import { createContext, useState, useContext, useEffect, ReactNode } from 'react'

export type AudioQuality = 'low' | 'medium' | 'high' | 'veryhigh'

interface SettingsContextType {
  audioQuality: AudioQuality
  setAudioQuality: (quality: AudioQuality) => void
  autoSave: boolean
  setAutoSave: (enabled: boolean) => void
  language: string
  setLanguage: (language: string) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// Local Storage key
const SETTINGS_KEY = 'voice_recorder_settings'

// Default settings
const defaultSettings = {
  audioQuality: 'high' as AudioQuality,
  autoSave: true,
  language: 'english'
}

// Audio quality bitrates in bps
export const audioBitrates = {
  low: 32000,
  medium: 96000,
  high: 128000,
  veryhigh: 192000
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [audioQuality, setAudioQualitySetting] = useState<AudioQuality>(defaultSettings.audioQuality)
  const [autoSave, setAutoSaveSetting] = useState(defaultSettings.autoSave)
  const [language, setLanguageSetting] = useState(defaultSettings.language)
  
  // Load settings from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem(SETTINGS_KEY)
      
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings)
        setAudioQualitySetting(parsedSettings.audioQuality || defaultSettings.audioQuality)
        setAutoSaveSetting(parsedSettings.autoSave !== undefined ? parsedSettings.autoSave : defaultSettings.autoSave)
        setLanguageSetting(parsedSettings.language || defaultSettings.language)
      }
    }
  }, [])
  
  // Update local storage when settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        audioQuality,
        autoSave,
        language
      }))
    }
  }, [audioQuality, autoSave, language])
  
  // Wrapper functions to update settings
  const setAudioQuality = (quality: AudioQuality) => {
    setAudioQualitySetting(quality)
  }
  
  const setAutoSave = (enabled: boolean) => {
    setAutoSaveSetting(enabled)
  }
  
  const setLanguage = (lang: string) => {
    setLanguageSetting(lang)
  }
  
  const value = {
    audioQuality,
    setAudioQuality,
    autoSave,
    setAutoSave,
    language,
    setLanguage
  }
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  
  return context
} 