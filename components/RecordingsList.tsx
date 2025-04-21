import { useState } from 'react'
import { format } from 'date-fns'

export type Recording = {
  id: string
  name: string
  duration: number
  date: Date
  url: string
}

type RecordingsListProps = {
  recordings: Recording[]
  onPlay: (recording: Recording) => void
  onEdit: (recording: Recording) => void
  onDelete: (id: string) => void
}

export default function RecordingsList({ 
  recordings, 
  onPlay, 
  onEdit, 
  onDelete 
}: RecordingsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter recordings by name
  const filteredRecordings = recordings.filter(
    recording => recording.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="bg-white dark:bg-darkBg rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">My Recordings</h2>
        
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
              placeholder="Search recordings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {filteredRecordings.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {recordings.length === 0 ? 'No recordings yet' : 'No recordings match your search'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRecordings.map(recording => (
              <div key={recording.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium truncate">{recording.name}</h3>
                    <div className="flex text-sm text-gray-500 dark:text-gray-400">
                      <span>{format(new Date(recording.date), 'MMM d, yyyy · h:mm a')}</span>
                      <span className="mx-2">·</span>
                      <span>{formatDuration(recording.duration)}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => onPlay(recording)}
                      className="p-2 text-secondary hover:bg-secondary hover:bg-opacity-10 rounded-full transition-colors"
                      aria-label="Play"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => onEdit(recording)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      aria-label="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => onDelete(recording.id)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 dark:hover:bg-opacity-30 rounded-full transition-colors"
                      aria-label="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 