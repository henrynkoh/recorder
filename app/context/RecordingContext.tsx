'use client'

import { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { Recording } from '@/components/RecordingsList'
import { storeAudioBlob, getAudioBlob, deleteAudioBlob } from '@/app/utils/audioStorage'
import { initSampleRecordings, sampleRecordings } from '@/app/utils/sampleData'

interface RecordingContextType {
  recordings: Recording[]
  addRecording: (recording: Omit<Recording, 'id'> & { audioBlob?: Blob }) => Promise<Recording>
  updateRecording: (recording: Recording) => Promise<Recording>
  deleteRecording: (id: string) => Promise<boolean>
  getAudioForRecording: (id: string) => Promise<string>
  isLoading: boolean
  error: string | null
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined)

// Local Storage key
const STORAGE_KEY = 'voice_recorder_recordings'

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Load recordings from local storage on mount
  useEffect(() => {
    loadRecordingsFromStorage()
  }, [])
  
  // Initialize sample data if no recordings exist
  useEffect(() => {
    if (!isLoading && recordings.length === 0) {
      // Initialize with sample data
      initSampleRecordings().then(() => {
        setRecordings(sampleRecordings)
        saveRecordingsToStorage(sampleRecordings)
      })
    }
  }, [isLoading, recordings.length])
  
  // Save recordings to local storage whenever they change
  useEffect(() => {
    if (!isLoading && recordings.length > 0) {
      saveRecordingsToStorage(recordings)
    }
  }, [recordings, isLoading])
  
  // Load recordings from local storage
  const loadRecordingsFromStorage = () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Check if localStorage is available (will not be during SSR)
      if (typeof window !== 'undefined') {
        const storedData = localStorage.getItem(STORAGE_KEY)
        
        if (storedData) {
          const parsedData = JSON.parse(storedData)
          
          // Convert date strings to Date objects
          const formattedData = parsedData.map((rec: any) => ({
            ...rec,
            date: new Date(rec.date)
          }))
          
          setRecordings(formattedData)
        }
      }
    } catch (err) {
      console.error('Error loading recordings from storage:', err)
      setError('Failed to load recordings. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Save recordings to local storage
  const saveRecordingsToStorage = (data: Recording[]) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      }
    } catch (err) {
      console.error('Error saving recordings to storage:', err)
    }
  }
  
  // Get audio URL for a recording
  const getAudioForRecording = async (id: string): Promise<string> => {
    try {
      // Try to get the audio blob from IndexedDB
      const blob = await getAudioBlob(id)
      
      if (blob) {
        // Create a URL for the blob
        return URL.createObjectURL(blob)
      } else {
        throw new Error('Audio data not found')
      }
    } catch (err) {
      console.error('Error getting audio for recording:', err)
      throw err
    }
  }
  
  const addRecording = async (recording: Omit<Recording, 'id'> & { audioBlob?: Blob }): Promise<Recording> => {
    try {
      setError(null)
      
      // Generate a unique ID
      const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      
      // Extract audioBlob from recording data
      const { audioBlob, ...recordingData } = recording
      
      // Create the new recording object
      const newRecording = {
        id,
        ...recordingData
      }
      
      // If audio blob is provided, store it in IndexedDB
      if (audioBlob) {
        await storeAudioBlob(id, audioBlob)
      }
      
      // Update state
      setRecordings(prev => [...prev, newRecording])
      
      return newRecording
    } catch (err) {
      console.error('Error adding recording:', err)
      setError('Failed to add recording. Please try again.')
      throw err
    }
  }
  
  const updateRecording = async (recording: Recording): Promise<Recording> => {
    try {
      setError(null)
      
      // Update state
      setRecordings(prev => 
        prev.map(rec => rec.id === recording.id ? recording : rec)
      )
      
      return recording
    } catch (err) {
      console.error('Error updating recording:', err)
      setError('Failed to update recording. Please try again.')
      throw err
    }
  }
  
  const deleteRecording = async (id: string): Promise<boolean> => {
    try {
      setError(null)
      
      // Delete audio blob from IndexedDB
      await deleteAudioBlob(id)
      
      // Update state
      setRecordings(prev => prev.filter(rec => rec.id !== id))
      
      return true
    } catch (err) {
      console.error('Error deleting recording:', err)
      setError('Failed to delete recording. Please try again.')
      return false
    }
  }
  
  const value = {
    recordings,
    addRecording,
    updateRecording,
    deleteRecording,
    getAudioForRecording,
    isLoading,
    error
  }
  
  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  )
}

export function useRecordings() {
  const context = useContext(RecordingContext)
  
  if (context === undefined) {
    throw new Error('useRecordings must be used within a RecordingProvider')
  }
  
  return context
} 