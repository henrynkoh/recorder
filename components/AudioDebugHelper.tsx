'use client'

import { useState, useEffect } from 'react'

interface AudioDebugHelperProps {
  isVisible: boolean;
}

export default function AudioDebugHelper({ isVisible }: AudioDebugHelperProps) {
  const [audioContextState, setAudioContextState] = useState<string>('unknown');
  const [hasMicrophone, setHasMicrophone] = useState<boolean | null>(null);
  const [hasAudioOutput, setHasAudioOutput] = useState<boolean | null>(null);
  const [browserInfo, setBrowserInfo] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    if (!isVisible) return;
    
    // Check audio context
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const context = new AudioContext();
        setAudioContextState(context.state);
        
        // Try to resume the context
        if (context.state === 'suspended') {
          context.resume().catch(err => {
            console.error('Failed to resume audio context:', err);
          });
        }
      } else {
        setAudioContextState('not supported');
      }
    } catch (e) {
      console.error('Error creating audio context:', e);
      setAudioContextState('error');
    }
    
    // Check for microphone
    if (navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const hasMic = devices.some(device => device.kind === 'audioinput');
          setHasMicrophone(hasMic);
        })
        .catch(err => {
          console.error('Error enumerating devices:', err);
          setHasMicrophone(null);
        });
    } else {
      setHasMicrophone(false);
    }
    
    // Check for audio output
    if (navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const hasOutput = devices.some(device => device.kind === 'audiooutput');
          setHasAudioOutput(hasOutput);
        })
        .catch(err => {
          console.error('Error enumerating devices:', err);
          setHasAudioOutput(null);
        });
    } else {
      setHasAudioOutput(false);
    }
    
    // Get browser info
    setBrowserInfo(`${navigator.userAgent}`);
    
  }, [isVisible]);
  
  // Test audio playback
  const testAudio = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContext();
      
      // Create a short beep sound
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, context.currentTime); // A4 note
      
      gainNode.gain.setValueAtTime(0.1, context.currentTime); // Set volume to 10%
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5); // Fade out
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start();
      oscillator.stop(context.currentTime + 0.5);
      
      alert('If you heard a beep sound, audio is working properly.');
    } catch (err) {
      console.error('Error testing audio:', err);
      alert('Failed to test audio. Your browser may have restrictions on audio playback.');
    }
  };
  
  if (!isVisible) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg mt-4 mb-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
          Audio Troubleshooting
        </h3>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-yellow-600 dark:text-yellow-300 underline"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-yellow-800 dark:text-yellow-200">
                <strong>Audio System Status:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                <li>
                  Audio Context: {' '}
                  <span className={
                    audioContextState === 'running' ? 'text-green-600 dark:text-green-400' :
                    audioContextState === 'suspended' ? 'text-red-600 dark:text-red-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }>
                    {audioContextState}
                  </span>
                </li>
                <li>
                  Microphone: {' '}
                  <span className={
                    hasMicrophone === true ? 'text-green-600 dark:text-green-400' :
                    hasMicrophone === false ? 'text-red-600 dark:text-red-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }>
                    {hasMicrophone === true ? 'Available' : 
                     hasMicrophone === false ? 'Not available' : 
                     'Unknown'}
                  </span>
                </li>
                <li>
                  Audio Output: {' '}
                  <span className={
                    hasAudioOutput === true ? 'text-green-600 dark:text-green-400' :
                    hasAudioOutput === false ? 'text-red-600 dark:text-red-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }>
                    {hasAudioOutput === true ? 'Available' : 
                     hasAudioOutput === false ? 'Not available' : 
                     'Unknown'}
                  </span>
                </li>
              </ul>
            </div>
            
            <div>
              <p className="mb-2 text-yellow-800 dark:text-yellow-200">
                <strong>Troubleshooting Steps:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                <li>Check your volume settings</li>
                <li>Try using headphones</li>
                <li>Make sure no other app is using your microphone</li>
                <li>Try a different browser</li>
                <li>Clear browser cache and cookies</li>
              </ul>
              
              <button
                onClick={testAudio}
                className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
              >
                Test Audio
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              <strong>Browser Info:</strong> {browserInfo}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 