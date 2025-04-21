'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import AudioRecorder from '@/components/AudioRecorder'
import { useRecordings } from '@/app/context/RecordingContext'

export default function RecordPage() {
  const router = useRouter()
  const [recordingName, setRecordingName] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const { addRecording } = useRecordings()
  
  const handleRecordingComplete = async (blob: Blob) => {
    try {
      // Get the duration from the state
      const duration = recordingTime
      
      // Create a new recording object with the audio blob
      const newRecording = {
        name: recordingName || `Recording ${new Date().toLocaleString()}`,
        date: new Date(),
        duration,
        url: '', // This will be replaced with a real URL when playing
        audioBlob: blob
      }
      
      // Save the recording using our context
      await addRecording(newRecording)
      
      // Navigate to the recordings page
      router.push('/recordings')
    } catch (error) {
      console.error('Error saving recording:', error)
      alert('Failed to save recording. Please try again.')
    }
  }
  
  // Function to update the recording time
  const updateRecordingTime = (time: number) => {
    setRecordingTime(time)
  }
  
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
          <h1 className="text-2xl font-bold">New Recording</h1>
        </div>
        
        <AudioRecorder 
          onRecordingComplete={handleRecordingComplete}
          onRecordingNameChange={setRecordingName}
          onTimerUpdate={updateRecordingTime}
        />
        
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Your recordings will be saved to your device.
          </p>
        </div>
      </div>
    </div>
  )
} 