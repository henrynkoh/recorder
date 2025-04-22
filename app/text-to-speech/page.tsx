'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

export default function TextToSpeechPage() {
  const [text, setText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(1)
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  
  // Load available voices when component mounts
  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Get the list of voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
        
        // Set default voice (preferably a natural sounding one)
        if (availableVoices.length > 0) {
          // Try to find English voices first
          const englishVoices = availableVoices.filter(voice => 
            voice.lang.includes('en') && voice.localService
          )
          
          if (englishVoices.length > 0) {
            setSelectedVoice(englishVoices[0].name)
          } else {
            setSelectedVoice(availableVoices[0].name)
          }
        }
      }
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
      
      loadVoices()
      
      // Clean up
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel()
        }
      }
    }
  }, [])
  
  // Handle speech end
  useEffect(() => {
    const handleSpeechEnd = () => {
      setIsSpeaking(false)
      setIsPaused(false)
    }
    
    if (utteranceRef.current) {
      utteranceRef.current.onend = handleSpeechEnd
    }
    
    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null
      }
    }
  }, [utteranceRef.current])
  
  const speak = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text)
      utteranceRef.current = utterance
      
      // Set voice
      if (selectedVoice) {
        const voice = voices.find(v => v.name === selectedVoice)
        if (voice) {
          utterance.voice = voice
        }
      }
      
      // Set speech parameters
      utterance.rate = rate
      utterance.pitch = pitch
      utterance.volume = volume
      
      // Start speaking
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
      setIsPaused(false)
      
      // Handle speech end
      utterance.onend = () => {
        setIsSpeaking(false)
        setIsPaused(false)
      }
    } else {
      alert('Your browser does not support text-to-speech functionality.')
    }
  }
  
  const pause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeaking && !isPaused) {
        window.speechSynthesis.pause()
        setIsPaused(true)
      } else if (isSpeaking && isPaused) {
        window.speechSynthesis.resume()
        setIsPaused(false)
      }
    }
  }
  
  const stop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
    }
  }
  
  return (
    <div>
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="text-secondary mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Script Reader</h1>
        </div>
        
        <div className="bg-white dark:bg-darkBg rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <div className="mb-6">
              <label htmlFor="scriptText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your script below
              </label>
              <textarea
                id="scriptText"
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
                placeholder="Type or paste the text you want to be read aloud..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Voice Selection */}
              <div>
                <label htmlFor="voice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voice
                </label>
                <select
                  id="voice"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                >
                  {voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Rate Control */}
              <div>
                <label htmlFor="rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Speed: {rate.toFixed(1)}x
                </label>
                <input
                  id="rate"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
              
              {/* Pitch Control */}
              <div>
                <label htmlFor="pitch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pitch: {pitch.toFixed(1)}
                </label>
                <input
                  id="pitch"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
              
              {/* Volume Control */}
              <div>
                <label htmlFor="volume" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Volume: {Math.round(volume * 100)}%
                </label>
                <input
                  id="volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            </div>
            
            {/* Playback Controls */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={speak}
                disabled={!text || isSpeaking}
                className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-md transition-colors ${
                  !text || isSpeaking
                    ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-dark text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play
              </button>
              
              <button
                onClick={pause}
                disabled={!isSpeaking}
                className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-md transition-colors ${
                  !isSpeaking
                    ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 cursor-not-allowed'
                    : isPaused
                      ? 'bg-secondary hover:bg-secondary-dark text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {isPaused ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Resume
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Pause
                  </>
                )}
              </button>
              
              <button
                onClick={stop}
                disabled={!isSpeaking}
                className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-md transition-colors ${
                  !isSpeaking
                    ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                Stop
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-darkBg rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tips for Natural-Sounding Speech</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Add punctuation to control pacing (commas for short pauses, periods for longer pauses)</li>
              <li>Use question marks to add appropriate intonation for questions</li>
              <li>Add emphasis with italics by surrounding text with asterisks (e.g., *important*)</li>
              <li>Experiment with different voices - some sound more natural than others</li>
              <li>Adjust the speed and pitch to match the tone you want</li>
              <li>Break long texts into paragraphs for better flow</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 