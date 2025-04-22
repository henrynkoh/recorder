'use client'

import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import Header from '@/components/Header'

export default function SimplePage() {
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingName, setRecordingName] = useState('')
  
  // Playback state
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  
  // Quality settings
  const [qualityLevel, setQualityLevel] = useState(3) // Default to level 3 (high)
  
  const qualitySettings = {
    1: { label: 'Low', bitrate: 32000, description: 'Smallest size (32 kbps)' },
    2: { label: 'Medium', bitrate: 96000, description: 'Balanced (96 kbps)' },
    3: { label: 'High', bitrate: 128000, description: 'Better quality (128 kbps)' },
    4: { label: 'Very High', bitrate: 192000, description: 'Best quality (192 kbps)' }
  }
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl)
      }
    }
  }, [recordingUrl])
  
  // Set up audio element event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      
      // Apply audio enhancement settings
      if ('preservesPitch' in audio) {
        // @ts-ignore - TypeScript doesn't know about this property yet
        audio.preservesPitch = true
      }
      
      // Set initial volume
      audio.volume = volume
    }
    
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [volume])
  
  // Start recording
  const startRecording = async () => {
    try {
      // Initialize default recording name
      const defaultName = `Recording ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`
      setRecordingName(defaultName)
      
      // Reset recording time
      setRecordingTime(0)
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          // Apply audio quality settings
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 44100,
        } 
      })
      streamRef.current = stream
      
      // Create media recorder with audio quality options
      const options = {
        audioBitsPerSecond: qualitySettings[qualityLevel as keyof typeof qualitySettings].bitrate,
        mimeType: 'audio/webm'
      }
      
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      
      // Reset chunks
      chunksRef.current = []
      
      // Setup event handlers
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        // Create blob with appropriate audio type and higher quality
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        
        // Create URL for the audio blob
        if (recordingUrl) {
          URL.revokeObjectURL(recordingUrl)
        }
        const url = URL.createObjectURL(blob)
        setRecordingUrl(url)
      }
      
      // Start recording
      mediaRecorder.start(10)
      setIsRecording(true)
      setIsPaused(false)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Unable to access microphone. Please make sure you have granted permission.')
    }
  }
  
  // Pause/resume recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        // Resume recording
        mediaRecorderRef.current.resume()
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
        setIsPaused(false)
      } else {
        // Pause recording
        mediaRecorderRef.current.pause()
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        setIsPaused(true)
      }
    }
  }
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      setIsRecording(false)
      setIsPaused(false)
    }
  }
  
  // Handle playback
  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio || !recordingUrl) return
    
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(err => {
        console.error('Error playing audio:', err)
      })
      setIsPlaying(true)
    }
  }
  
  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    
    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    const newVolume = parseFloat(e.target.value)
    
    if (!audio) return
    
    audio.volume = newVolume
    setVolume(newVolume)
  }
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Handle recording name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecordingName(e.target.value)
  }
  
  // Handle quality level change
  const handleQualityChange = (level: number) => {
    setQualityLevel(level)
  }
  
  // Download recording
  const downloadRecording = () => {
    if (!recordingUrl) return
    
    const a = document.createElement('a')
    a.href = recordingUrl
    a.download = `${recordingName || 'recording'}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
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
          <h1 className="text-2xl font-bold">Simple Recorder</h1>
        </div>
        
        <div className="bg-white dark:bg-darkBg rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            {/* Recording Name Input */}
            <div className="mb-6">
              <label htmlFor="recordingName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recording Name
              </label>
              <input
                type="text"
                id="recordingName"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
                placeholder="Enter recording name"
                value={recordingName}
                onChange={handleNameChange}
                disabled={isRecording}
              />
            </div>
            
            {/* Quality Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Audio Quality
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(level => (
                  <button
                    key={level}
                    onClick={() => handleQualityChange(level)}
                    disabled={isRecording}
                    className={`p-3 border rounded-lg flex flex-col items-center text-center transition-colors
                      ${qualityLevel === level 
                        ? 'bg-secondary text-white border-secondary' 
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-secondary dark:hover:border-secondary'
                      }
                      ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="font-bold text-lg">{level}</span>
                    <span className={`font-medium ${qualityLevel === level ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {qualitySettings[level as keyof typeof qualitySettings].label}
                    </span>
                    <span className={`text-xs mt-1 ${qualityLevel === level ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {qualitySettings[level as keyof typeof qualitySettings].description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Recording Controls */}
            <div className="flex justify-center mb-6">
              <div className="text-4xl font-mono mb-4 text-center">
                {formatTime(recordingTime)}
              </div>
            </div>
            
            <div className="flex justify-center space-x-4 mb-8">
              {!isRecording ? (
                <button
                  className="bg-primary hover:bg-primary-dark text-white flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-colors"
                  onClick={startRecording}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <circle cx="10" cy="10" r="8" />
                  </svg>
                </button>
              ) : (
                <>
                  <button
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 shadow-md transition-colors
                      ${isPaused 
                        ? 'border-secondary text-secondary hover:bg-secondary hover:text-white' 
                        : 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white'
                      }`}
                    onClick={pauseRecording}
                  >
                    {isPaused ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  <button
                    className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white shadow-md transition-colors"
                    onClick={stopRecording}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            
            <div className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
              {isRecording ? (
                isPaused ? 'Recording paused' : 'Recording in progress...'
              ) : (
                recordingUrl ? 'Recording complete! Play it back below or download it.' : 'Click the record button to start'
              )}
            </div>
            
            {/* Playback Section */}
            {recordingUrl && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <h3 className="text-lg font-medium mb-4">Playback</h3>
                
                <audio ref={audioRef} src={recordingUrl} preload="metadata" style={{ display: 'none' }} />
                
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                
                <div className="flex justify-center mb-4">
                  <button
                    onClick={togglePlayPause}
                    className="bg-secondary hover:bg-secondary-dark text-white flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-colors"
                  >
                    {isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Volume Control */}
                <div className="mb-6">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                    </svg>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full h-2 mx-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Download Button */}
                <div className="flex justify-center">
                  <button
                    onClick={downloadRecording}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download Recording
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 