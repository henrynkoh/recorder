import Header from '@/components/Header'
import Link from 'next/link'

export default function AboutPage() {
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
          <h1 className="text-2xl font-bold">About Voice Recorder</h1>
        </div>
        
        <div className="bg-white dark:bg-darkBg rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
            <p className="mb-4">
              Voice Recorder is designed to help you capture, track, and organize your important conversations.
              Whether you're recording lectures, meetings, interviews, or personal notes, our app provides
              a simple and powerful way to manage your audio recordings.
            </p>
            
            <h2 className="text-xl font-semibold mb-4">Key Features</h2>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>High-quality audio recording with pause/resume functionality</li>
              <li>Simple and intuitive interface for easy navigation</li>
              <li>Organize recordings with custom names and categories</li>
              <li>Playback with variable speed controls</li>
              <li>Secure storage of your recordings</li>
              <li>Easy sharing options</li>
            </ul>
            
            <h2 className="text-xl font-semibold mb-4">Educational Use</h2>
            <p className="mb-4">
              Our app is particularly useful for educational purposes:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Record lectures and study sessions</li>
              <li>Track progress in language learning</li>
              <li>Create audio notes for courses</li>
              <li>Prepare for presentations and speeches</li>
              <li>Record feedback from instructors</li>
            </ul>
            
            <h2 className="text-xl font-semibold mb-4">Privacy &amp; Security</h2>
            <p>
              We take your privacy seriously. Your recordings are stored securely on your device
              and are not uploaded to any server without your explicit permission. We do not access
              or analyze the content of your recordings.
            </p>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
          © {new Date().getFullYear()} Voice Recorder App - All Rights Reserved
        </div>
      </div>
    </div>
  )
} 