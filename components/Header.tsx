'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/app/context/ThemeContext'

export default function Header() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  
  return (
    <header className="bg-white dark:bg-darkBg shadow-md mb-6">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="w-8 h-8 mr-2 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </div>
          <span className="text-2xl font-bold text-primary">Voice Recorder</span>
        </Link>
        
        <div className="flex items-center">
          <button 
            onClick={toggleTheme}
            className="p-2 mr-4 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              // Sun icon for dark mode (switch to light)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              // Moon icon for light mode (switch to dark)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          
          <nav className="hidden md:flex space-x-6">
            <NavLink href="/" label="Home" active={pathname === '/'} />
            <NavLink href="/record" label="Record" active={pathname === '/record'} />
            <NavLink href="/text-to-speech" label="Script Reader" active={pathname === '/text-to-speech'} />
            <NavLink href="/recordings" label="My Recordings" active={pathname === '/recordings'} />
            <NavLink href="/settings" label="Settings" active={pathname === '/settings'} />
          </nav>
        </div>
        
        <div className="md:hidden">
          {/* Mobile menu button would go here */}
          <button className="p-2">
            <span className="block w-6 h-0.5 bg-gray-800 dark:bg-gray-200 mb-1"></span>
            <span className="block w-6 h-0.5 bg-gray-800 dark:bg-gray-200 mb-1"></span>
            <span className="block w-6 h-0.5 bg-gray-800 dark:bg-gray-200"></span>
          </button>
        </div>
      </div>
    </header>
  )
}

type NavLinkProps = {
  href: string
  label: string
  active: boolean
}

function NavLink({ href, label, active }: NavLinkProps) {
  return (
    <Link 
      href={href}
      className={`transition-colors ${
        active 
          ? 'text-primary font-medium border-b-2 border-primary' 
          : 'text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary'
      }`}
    >
      {label}
    </Link>
  )
} 