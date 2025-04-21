'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import RecordingsList, { Recording } from '@/components/RecordingsList'
import AudioPlayer from '@/components/AudioPlayer'
import { useRecordings } from '@/app/context/RecordingContext'

export default function RecordingsPage() {
  const { recordings, updateRecording, deleteRecording, isLoading, error } = useRecordings()
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null)
  
  const handlePlay = (recording: Recording) => {
    setCurrentRecording(recording)
  }
  
  const handleEdit = async (recording: Recording) => {
    // In a real app, we would open a modal for editing
    const newName = prompt('Enter new name for recording:', recording.name)
    
    if (newName && newName !== recording.name) {
      try {
        await updateRecording({
          ...recording,
          name: newName
        })
      } catch (err) {
        console.error('Failed to update recording:', err)
      }
    }
  }
  
  const handleDelete = async (id: string) => {
    // In a real app, we would show a confirmation dialog
    if (confirm('Are you sure you want to delete this recording?')) {
      try {
        await deleteRecording(id)
        
        // If the deleted recording is currently playing, close the player
        if (currentRecording && currentRecording.id === id) {
          setCurrentRecording(null)
        }
      } catch (err) {
        console.error('Failed to delete recording:', err)
      }
    }
  }
  
  return (
    <div>
      <Header />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/" className="text-secondary mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold">My Recordings</h1>
          </div>
          
          <Link href="/record" className="btn-primary">
            New Recording
          </Link>
        </div>
        
        {isLoading ? (
          <div className="bg-white dark:bg-darkBg rounded-xl shadow-lg overflow-hidden p-6 text-center">
            <p>Loading recordings...</p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-darkBg rounded-xl shadow-lg overflow-hidden p-6 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <RecordingsList 
            recordings={recordings} 
            onPlay={handlePlay} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        )}
        
        <AudioPlayer 
          recording={currentRecording} 
          onClose={() => setCurrentRecording(null)} 
        />
      </div>
    </div>
  )
} 