'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

// Types for premium voice options
type PremiumVoiceProvider = 'browser' | 'google' | 'amazon' | 'elevenlabs'

interface PremiumVoiceOption {
  id: string
  name: string
  gender: string
  provider: PremiumVoiceProvider
  description: string
  isPremium: boolean
}

export default function TextToSpeechPage() {
  const [text, setText] = useState('')
  const [processedText, setProcessedText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [rate, setRate] = useState(0.9) // Slightly slower default for more natural sound
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(1)
  const [useSSML, setUseSSML] = useState(true)
  const [naturalPauses, setNaturalPauses] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<PremiumVoiceProvider>('browser')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  
  // Premium voice options (would typically connect to the APIs)
  const premiumVoices: PremiumVoiceOption[] = [
    // ElevenLabs premium voices
    { 
      id: 'eleven_rachel', 
      name: 'Rachel', 
      gender: 'female', 
      provider: 'elevenlabs',
      description: 'Warm, natural female voice with American accent',
      isPremium: true
    },
    { 
      id: 'eleven_josh', 
      name: 'Josh', 
      gender: 'male', 
      provider: 'elevenlabs',
      description: 'Deep, authoritative male voice with British accent',
      isPremium: true
    },
    // Google premium voices
    { 
      id: 'google_wavenet_f', 
      name: 'Wavenet Female', 
      gender: 'female', 
      provider: 'google',
      description: 'Highly natural female voice using neural networks',
      isPremium: true
    },
    { 
      id: 'google_wavenet_m', 
      name: 'Wavenet Male', 
      gender: 'male', 
      provider: 'google',
      description: 'Authentic-sounding male voice with natural pauses',
      isPremium: true
    },
    // Amazon Polly premium voices
    { 
      id: 'amazon_joanna', 
      name: 'Joanna', 
      gender: 'female', 
      provider: 'amazon',
      description: 'Professional female voice with natural intonation',
      isPremium: true
    },
    { 
      id: 'amazon_matthew', 
      name: 'Matthew', 
      gender: 'male', 
      provider: 'amazon',
      description: 'Clear and articulate male voice with American accent',
      isPremium: true
    },
  ]
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  
  // Load available voices when component mounts
  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Get the list of voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
        
        // Set default voice (preferably a natural sounding one)
        if (availableVoices.length > 0) {
          // Try to find the most natural-sounding voices first
          const naturalVoices = availableVoices.filter(voice => 
            (voice.name.includes('Google') || voice.name.includes('Neural') || voice.name.includes('Premium')) && 
            voice.lang.includes('en')
          )
          
          if (naturalVoices.length > 0) {
            setSelectedVoice(naturalVoices[0].name)
          } else {
            // Fallback to any English voice
            const englishVoices = availableVoices.filter(voice => 
              voice.lang.includes('en')
            )
            
            if (englishVoices.length > 0) {
              setSelectedVoice(englishVoices[0].name)
            } else {
              setSelectedVoice(availableVoices[0].name)
            }
          }
        }
      }
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
      
      loadVoices()
      
      // Clean up
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel()
        }
      }
    }
  }, [])
  
  // Handle speech end
  useEffect(() => {
    const handleSpeechEnd = () => {
      setIsSpeaking(false)
      setIsPaused(false)
    }
    
    if (utteranceRef.current) {
      utteranceRef.current.onend = handleSpeechEnd
    }
    
    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null
      }
    }
  }, [utteranceRef.current])
  
  // Process text to make it sound more natural
  const processTextForNaturalSpeech = (inputText: string) => {
    if (!naturalPauses) return inputText;
    
    let processedText = inputText;
    
    // Add slight pauses after commas, periods, etc.
    processedText = processedText.replace(/,/g, ', <break time="200ms"/>');
    processedText = processedText.replace(/\./g, '. <break time="400ms"/>');
    processedText = processedText.replace(/\?/g, '? <break time="400ms"/>');
    processedText = processedText.replace(/\!/g, '! <break time="400ms"/>');
    
    // Add emphasis to words between asterisks
    processedText = processedText.replace(/\*([^*]+)\*/g, '<emphasis>$1</emphasis>');
    
    // Wrap in SSML tags if using SSML
    if (useSSML) {
      processedText = `<speak>${processedText}</speak>`;
    } else {
      // Remove SSML tags if not using SSML
      processedText = processedText
        .replace(/<break time="[^"]+"\/?>/g, '')
        .replace(/<emphasis>/g, '')
        .replace(/<\/emphasis>/g, '');
    }
    
    return processedText;
  };
  
  // Handle text change
  useEffect(() => {
    const processed = processTextForNaturalSpeech(text);
    setProcessedText(processed);
  }, [text, naturalPauses, useSSML]);
  
  const speakWithBrowserVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel()
        
        // Log available voices for debugging
        console.log("Available voices:", voices);
        console.log("Selected voice:", selectedVoice);
        
        // Create a new utterance - SSML doesn't work directly with the browser API,
        // so we need to extract plain text from it
        let utteranceText = text;
        
        // Process the text with natural pauses but without SSML tags
        if (naturalPauses) {
          // Add pauses by adding extra periods and commas instead of SSML
          utteranceText = utteranceText.replace(/\./g, '... ');
          utteranceText = utteranceText.replace(/,/g, ', ');
          
          // Add emphasis by repeating words instead of SSML
          utteranceText = utteranceText.replace(/\*([^*]+)\*/g, '$1 $1');
        }
        
        console.log("Using text for speech:", utteranceText);
        
        const utterance = new SpeechSynthesisUtterance(utteranceText);
        utteranceRef.current = utterance;
        
        // Set voice
        if (selectedVoice) {
          const voice = voices.find(v => v.name === selectedVoice);
          if (voice) {
            utterance.voice = voice;
            console.log("Using voice:", voice.name);
          } else {
            console.warn("Selected voice not found:", selectedVoice);
          }
        }
        
        // Set speech parameters
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        
        // Add event listeners for debugging
        utterance.onstart = () => console.log("Speech started");
        utterance.onpause = () => console.log("Speech paused");
        utterance.onresume = () => console.log("Speech resumed");
        utterance.onend = () => {
          console.log("Speech ended");
          setIsSpeaking(false);
          setIsPaused(false);
        };
        utterance.onerror = (event) => console.error("Speech error:", event);
        
        // Start speaking
        console.log("Starting speech synthesis...");
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        setIsPaused(false);
        
      } catch (error: any) {
        console.error("Error in speech synthesis:", error);
        alert("Error with text-to-speech: " + (error.message || "Unknown error"));
      }
    } else {
      alert('Your browser does not support text-to-speech functionality. Please try a different browser like Chrome or Edge.');
    }
  }
  
  const speakWithPremiumVoice = async () => {
    if (!apiKey && selectedProvider !== 'browser') {
      alert('Please enter an API key to use premium voices');
      return;
    }

    // For this demo, we'll simulate using a premium voice service
    // In a real implementation, this would call the respective API endpoints
    
    setIsSpeaking(true);
    setIsPaused(false);
    
    // In a real implementation, you would:
    // 1. Call the appropriate API (Google/Amazon/ElevenLabs)
    // 2. Pass the processed text, selected voice, and parameters
    // 3. Stream the audio response back to the user
    
    // Simulating API call for demo purposes
    try {
      // For the demo, we'll use the browser's speech synthesis as a fallback
      // but indicate we're using a premium service
      
      alert(`Using premium voice from ${selectedProvider.toUpperCase()}. 
In a real implementation, this would call the ${selectedProvider} API with your text.
For now, we'll fall back to the browser's speech synthesis.`);
      
      speakWithBrowserVoice();
      
    } catch (error) {
      console.error('Error with premium voice service:', error);
      alert('There was an error using the premium voice service. Falling back to browser voice.');
      speakWithBrowserVoice();
    }
  }
  
  const speak = () => {
    if (selectedProvider === 'browser') {
      speakWithBrowserVoice();
    } else {
      speakWithPremiumVoice();
    }
  }
  
  const pause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && selectedProvider === 'browser') {
      if (isSpeaking && !isPaused) {
        window.speechSynthesis.pause()
        setIsPaused(true)
      } else if (isSpeaking && isPaused) {
        window.speechSynthesis.resume()
        setIsPaused(false)
      }
    } else if (selectedProvider !== 'browser') {
      // In a real implementation, you would call the API to pause/resume
      alert('Pause/resume for premium voices would call the respective API');
      setIsPaused(!isPaused);
    }
  }
  
  const stop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && selectedProvider === 'browser') {
      window.speechSynthesis.cancel()
    } else if (selectedProvider !== 'browser') {
      // In a real implementation, you would call the API to stop
      alert('Stop for premium voices would call the respective API');
    }
    
    setIsSpeaking(false)
    setIsPaused(false)
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
          <h1 className="text-2xl font-bold">Natural Script Reader</h1>
        </div>
        
        <div className="bg-white dark:bg-darkBg rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <div className="mb-6">
              <label htmlFor="scriptText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your script below
              </label>
              <textarea
                id="scriptText"
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
                placeholder="Type or paste the text you want to be read aloud in a natural voice..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            
            {/* Voice Provider Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voice Provider
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => setSelectedProvider('browser')}
                  className={`p-3 border rounded-lg flex flex-col items-center text-center transition-colors
                    ${selectedProvider === 'browser' 
                      ? 'bg-secondary text-white border-secondary' 
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-secondary dark:hover:border-secondary'
                    }
                  `}
                >
                  <span className="font-medium">Browser</span>
                  <span className="text-xs mt-1">Standard voices</span>
                </button>
                
                <button
                  onClick={() => setSelectedProvider('elevenlabs')}
                  className={`p-3 border rounded-lg flex flex-col items-center text-center transition-colors
                    ${selectedProvider === 'elevenlabs' 
                      ? 'bg-secondary text-white border-secondary' 
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-secondary dark:hover:border-secondary'
                    }
                  `}
                >
                  <span className="font-medium">ElevenLabs</span>
                  <span className="text-xs mt-1">Ultra-realistic voices</span>
                </button>
                
                <button
                  onClick={() => setSelectedProvider('google')}
                  className={`p-3 border rounded-lg flex flex-col items-center text-center transition-colors
                    ${selectedProvider === 'google' 
                      ? 'bg-secondary text-white border-secondary' 
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-secondary dark:hover:border-secondary'
                    }
                  `}
                >
                  <span className="font-medium">Google</span>
                  <span className="text-xs mt-1">WaveNet voices</span>
                </button>
                
                <button
                  onClick={() => setSelectedProvider('amazon')}
                  className={`p-3 border rounded-lg flex flex-col items-center text-center transition-colors
                    ${selectedProvider === 'amazon' 
                      ? 'bg-secondary text-white border-secondary' 
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-secondary dark:hover:border-secondary'
                    }
                  `}
                >
                  <span className="font-medium">Amazon</span>
                  <span className="text-xs mt-1">Polly neural voices</span>
                </button>
              </div>
            </div>
            
            {/* API Key for premium voices */}
            {selectedProvider !== 'browser' && (
              <div className="mb-6">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API Key
                </label>
                <div className="flex">
                  <input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
                    placeholder={`Enter your ${selectedProvider} API key`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    className="ml-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Required for premium voice quality. Your API key is never stored on our servers.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Voice Selection */}
              <div>
                <label htmlFor="voice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voice
                </label>
                {selectedProvider === 'browser' ? (
                  <select
                    id="voice"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                  >
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    id="premium-voice"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
                  >
                    {premiumVoices
                      .filter(voice => voice.provider === selectedProvider)
                      .map((voice) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name} ({voice.gender}) - {voice.description}
                        </option>
                      ))
                    }
                  </select>
                )}
              </div>
              
              {/* Rate Control */}
              <div>
                <label htmlFor="rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Speed: {rate.toFixed(1)}x
                </label>
                <input
                  id="rate"
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
              
              {/* Pitch Control */}
              <div>
                <label htmlFor="pitch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pitch: {pitch.toFixed(1)}
                </label>
                <input
                  id="pitch"
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
              
              {/* Volume Control */}
              <div>
                <label htmlFor="volume" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Volume: {Math.round(volume * 100)}%
                </label>
                <input
                  id="volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            </div>
            
            {/* Natural Speech Options */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Natural Speech Options</h3>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-secondary"
                    checked={naturalPauses}
                    onChange={(e) => setNaturalPauses(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable natural pauses</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-secondary"
                    checked={useSSML}
                    onChange={(e) => setUseSSML(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Use SSML for better speech</span>
                </label>
              </div>
            </div>
            
            {/* Playback Controls */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={speak}
                disabled={!text || isSpeaking}
                className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-md transition-colors ${
                  !text || isSpeaking
                    ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-dark text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play
              </button>
              
              <button
                onClick={pause}
                disabled={!isSpeaking}
                className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-md transition-colors ${
                  !isSpeaking
                    ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 cursor-not-allowed'
                    : isPaused
                      ? 'bg-secondary hover:bg-secondary-dark text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {isPaused ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Resume
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Pause
                  </>
                )}
              </button>
              
              <button
                onClick={stop}
                disabled={!isSpeaking}
                className={`flex items-center justify-center px-4 py-2 rounded-lg shadow-md transition-colors ${
                  !isSpeaking
                    ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                Stop
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-darkBg rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tips for Ultra-Natural Sounding Speech</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Use premium voices for the most realistic sound (requires API key)</li>
              <li>Add commas for natural breathing pauses</li>
              <li>Use periods for sentence breaks (the voice will naturally drop in tone)</li>
              <li>Add emphasis with asterisks around important words (e.g. *really* important)</li>
              <li>Use slightly slower speeds (0.8-0.9x) for more natural pacing</li>
              <li>Keep pitch settings close to natural (0.9-1.1x) unless doing character voices</li>
              <li>Enable natural pauses and SSML options for better speech patterns</li>
              <li>Add ellipses (...) when you want the voice to trail off</li>
              <li>Break long text into paragraphs for natural topic transitions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 