import Link from 'next/link'
import { FaMicrophone, FaList, FaUser, FaInfoCircle, FaCog, FaBookReader } from 'react-icons/fa'

export default function Home() {
  return (
    <div className="flex flex-col items-center p-6">
      <div className="mb-4 text-primary w-20 h-20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold mb-8 text-center">Voice Recorder App</h1>
      
      <div className="w-full max-w-md bg-white dark:bg-darkBg rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="p-6">
          <p className="text-lg text-center mb-6">
            Record, track, and manage your voice memos
          </p>
          
          <div className="space-y-4">
            <Link href="/record" className="recording-item block">
              <div className="flex items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-full mr-4">
                  <FaMicrophone className="text-primary text-xl" />
                </div>
                <div>
                  <h3 className="font-medium">New Recording</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start a new voice recording</p>
                </div>
              </div>
            </Link>
            
            <Link href="/text-to-speech" className="recording-item block">
              <div className="flex items-center">
                <div className="bg-blue-500 bg-opacity-10 p-3 rounded-full mr-4">
                  <FaBookReader className="text-blue-500 text-xl" />
                </div>
                <div>
                  <h3 className="font-medium">Script Reader</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Convert text to natural-sounding speech</p>
                </div>
              </div>
            </Link>
            
            <Link href="/recordings" className="recording-item block">
              <div className="flex items-center">
                <div className="bg-secondary bg-opacity-10 p-3 rounded-full mr-4">
                  <FaList className="text-secondary text-xl" />
                </div>
                <div>
                  <h3 className="font-medium">My Recordings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">View and manage all recordings</p>
                </div>
              </div>
            </Link>
            
            <Link href="/profile" className="recording-item block">
              <div className="flex items-center">
                <div className="bg-green-500 bg-opacity-10 p-3 rounded-full mr-4">
                  <FaUser className="text-green-500 text-xl" />
                </div>
                <div>
                  <h3 className="font-medium">Profile</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account settings</p>
                </div>
              </div>
            </Link>
            
            <Link href="/about" className="recording-item block">
              <div className="flex items-center">
                <div className="bg-purple-500 bg-opacity-10 p-3 rounded-full mr-4">
                  <FaInfoCircle className="text-purple-500 text-xl" />
                </div>
                <div>
                  <h3 className="font-medium">About</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Learn more about the app</p>
                </div>
              </div>
            </Link>
            
            <Link href="/settings" className="recording-item block">
              <div className="flex items-center">
                <div className="bg-gray-500 bg-opacity-10 p-3 rounded-full mr-4">
                  <FaCog className="text-gray-500 text-xl" />
                </div>
                <div>
                  <h3 className="font-medium">Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Configure app preferences</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Voice Recorder App
      </div>
    </div>
  )
} 