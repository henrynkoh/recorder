'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { useTheme } from '@/app/context/ThemeContext'

export default function SettingsPage() {
  const [audioQuality, setAudioQuality] = useState('high')
  const [autoSave, setAutoSave] = useState(true)
  const [language, setLanguage] = useState('english')
  
  // Use the theme context
  const { theme, toggleTheme } = useTheme()
  const isDarkMode = theme === 'dark'
  
  return (
    <div>
      <Header />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <Link href="/" className="text-secondary mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        
        <div className="bg-white dark:bg-darkBg rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <div className="space-y-6">
              {/* Audio Quality */}
              <div>
                <h3 className="text-lg font-medium mb-2">Audio Quality</h3>
                <div className="mt-2">
                  <select
                    id="audioQuality"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 dark:bg-gray-800"
                    value={audioQuality}
                    onChange={e => setAudioQuality(e.target.value)}
                  >
                    <option value="low">Low (32 kbps)</option>
                    <option value="medium">Medium (96 kbps)</option>
                    <option value="high">High (128 kbps)</option>
                    <option value="veryhigh">Very High (192 kbps)</option>
                  </select>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Higher quality uses more storage space
                </p>
              </div>
              
              {/* Auto Save */}
              <div>
                <h3 className="text-lg font-medium mb-2">Auto Save</h3>
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={autoSave}
                      onChange={e => setAutoSave(e.target.checked)}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-secondary"></div>
                    <span className="ml-3 text-sm font-medium">
                      Automatically save recordings
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Dark Mode */}
              <div>
                <h3 className="text-lg font-medium mb-2">Dark Mode</h3>
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isDarkMode}
                      onChange={toggleTheme}
                    />
                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    <span className="ml-3 text-sm font-medium">
                      Use dark mode
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Language */}
              <div>
                <h3 className="text-lg font-medium mb-2">Language</h3>
                <div className="mt-2">
                  <select
                    id="language"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 dark:bg-gray-800"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    <option value="english">English</option>
                    <option value="korean">Korean</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="japanese">Japanese</option>
                  </select>
                </div>
              </div>
              
              {/* Storage Management */}
              <div>
                <h3 className="text-lg font-medium mb-2">Storage Management</h3>
                <button className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  Clear Cached Data
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Used storage: 128 MB
                </p>
              </div>
              
              {/* Account */}
              <div>
                <h3 className="text-lg font-medium mb-2">Account</h3>
                <button className="bg-red-100 text-red-600 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-400 px-4 py-2 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  )
} 