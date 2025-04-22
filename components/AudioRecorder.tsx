import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { useSettings, audioBitrates } from '@/app/context/SettingsContext'

type AudioRecorderProps = {
  onRecordingComplete: (blob: Blob) => void
  onRecordingNameChange?: (name: string) => void
  onTimerUpdate?: (time: number) => void
}

export default function AudioRecorder({ 
  onRecordingComplete,
  onRecordingNameChange,
  onTimerUpdate
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingName, setRecordingName] = useState('')
  
  // Use integer levels instead of string quality settings for direct UI control
  const [qualityLevel, setQualityLevel] = useState(3) // Default to level 3 (high)
  
  const qualitySettings = {
    1: { label: 'Low', bitrate: 32000, description: 'Smallest size (32 kbps)' },
    2: { label: 'Medium', bitrate: 96000, description: 'Balanced (96 kbps)' },
    3: { label: 'High', bitrate: 128000, description: 'Better quality (128 kbps)' },
    4: { label: 'Very High', bitrate: 192000, description: 'Best quality (192 kbps)' }
  }
  
  // Get audio quality setting from global context (we'll still respect it for initial value)
  const { audioQuality } = useSettings()
  
  // Set initial quality level based on settings context
  useEffect(() => {
    switch(audioQuality) {
      case 'low': setQualityLevel(1); break;
      case 'medium': setQualityLevel(2); break;
      case 'high': setQualityLevel(3); break;
      case 'veryhigh': setQualityLevel(4); break;
      default: setQualityLevel(3);
    }
  }, [audioQuality]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])
  
  // Update parent component with name changes
  useEffect(() => {
    if (onRecordingNameChange) {
      onRecordingNameChange(recordingName)
    }
  }, [recordingName, onRecordingNameChange])
  
  // Update parent component with timer changes
  useEffect(() => {
    if (onTimerUpdate) {
      onTimerUpdate(recordingTime)
    }
  }, [recordingTime, onTimerUpdate])
  
  // Handle quality level change
  const handleQualityChange = (level: number) => {
    setQualityLevel(level)
  }
  
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
          // Set the bitrate based on quality selection
          channelCount: 1,
          sampleRate: 44100,
        } 
      })
      streamRef.current = stream
      
      // Create media recorder with audio quality options based on selected level
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
        
        // Pass the blob with actual recorded duration in seconds
        onRecordingComplete(blob)
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
  
  // Handle recording name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setRecordingName(newName)
  }
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-darkBg rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Record Audio</h2>
      
      <div className="w-full max-w-sm mb-6">
        <div className="mb-4">
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
        
        <div className="flex justify-center mb-4">
          <div className="text-4xl font-mono">
            {formatTime(recordingTime)}
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <button
              className="btn-primary flex items-center justify-center w-16 h-16 rounded-full"
              onClick={startRecording}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="10" r="8" />
              </svg>
            </button>
          ) : (
            <>
              <button
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  isPaused 
                    ? 'border-secondary text-secondary' 
                    : 'border-yellow-500 text-yellow-500'
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
                className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-red-500 text-red-500"
                onClick={stopRecording}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {isRecording ? (
          isPaused ? 'Recording paused' : 'Recording in progress...'
        ) : (
          'Click the record button to start'
        )}
      </div>
    </div>
  )
} 