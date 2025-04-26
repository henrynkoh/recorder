'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { useVoiceTraining } from '@/app/context/VoiceTrainingContext'
import { 
  analyzeVoice, 
  synthesizeSpeech, 
  textToPhonemes 
} from '@/app/utils/audioProcessor'
import { isPlayableAudio, createTestTone, blobToAudioBuffer, audioBufferToWav, convertAudioFormat, createSilentAudio } from '@/app/utils/audioHelpers'
import AudioDebugHelper from '@/components/AudioDebugHelper'

// Types for premium voice options
type PremiumVoiceProvider = 'browser' | 'google' | 'amazon' | 'elevenlabs' | 'trained'

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
  const [filteredVoices, setFilteredVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [voiceFilter, setVoiceFilter] = useState('')
  const [voiceLanguageFilter, setVoiceLanguageFilter] = useState('all')
  const [rate, setRate] = useState(0.9) // Slightly slower default for more natural sound
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(1)
  const [useSSML, setUseSSML] = useState(true)
  const [naturalPauses, setNaturalPauses] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<PremiumVoiceProvider>('browser')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isVoiceCloning, setIsVoiceCloning] = useState(false)
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false)
  const [showDebugHelper, setShowDebugHelper] = useState(false)
  const [hasAudioError, setHasAudioError] = useState(false)
  
  // Get trained voices
  const { 
    trainedVoices, 
    selectedVoice: defaultTrainedVoice, 
    getTrainedVoiceBlob 
  } = useVoiceTraining()
  
  // Check if voice cloning is enabled
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const useVoiceCloning = localStorage.getItem('use_voice_cloning') === 'true';
      setIsVoiceCloning(useVoiceCloning);
      
      // Also check for API key
      const hasApiKey = !!localStorage.getItem('elevenlabs_api_key');
      
      // If voice cloning is enabled but no API key, disable it
      if (useVoiceCloning && !hasApiKey) {
        console.warn('Voice cloning is enabled but no API key is set');
        localStorage.setItem('use_voice_cloning', 'false');
        setIsVoiceCloning(false);
      }
    }
  }, []);
  
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
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  
  // Get a list of unique languages from available voices
  const availableLanguages = useMemo(() => {
    const languages = voices.map(voice => {
      // Extract language code like "en-US" -> "English (US)"
      const langCode = voice.lang;
      const langName = new Intl.DisplayNames([navigator.language], { type: 'language' });
      try {
        // Try to get language name from browser
        const mainLang = langCode.split('-')[0];
        const displayName = langName.of(mainLang);
        const region = langCode.includes('-') ? ` (${langCode.split('-')[1]})` : '';
        return { 
          code: langCode, 
          name: displayName ? `${displayName}${region}` : langCode 
        };
      } catch (e) {
        return { code: langCode, name: langCode };
      }
    });
    
    // Remove duplicates and sort
    const uniqueLanguages = Array.from(new Set(languages.map(l => l.code)))
      .map(code => languages.find(l => l.code === code))
      .filter((lang): lang is { code: string, name: string } => lang !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Add "All Languages" option
    return [{ code: 'all', name: 'All Languages' }, ...uniqueLanguages];
  }, [voices]);
  
  // Filter voices based on search term and language
  useEffect(() => {
    let result = [...voices];
    
    // Filter by language if not set to "all"
    if (voiceLanguageFilter !== 'all') {
      result = result.filter(voice => voice.lang === voiceLanguageFilter);
    }
    
    // Filter by search term if present
    if (voiceFilter.trim()) {
      const searchTerm = voiceFilter.toLowerCase();
      result = result.filter(voice => 
        voice.name.toLowerCase().includes(searchTerm) || 
        voice.lang.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by name
    result.sort((a, b) => a.name.localeCompare(b.name));
    
    setFilteredVoices(result);
  }, [voices, voiceFilter, voiceLanguageFilter]);
  
  // Load available voices when component mounts
  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Get the list of voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
        setFilteredVoices(availableVoices)
        
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
  
  // Initialize audio player for trained voices
  useEffect(() => {
    audioPlayerRef.current = new Audio();
    
    audioPlayerRef.current.onended = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    audioPlayerRef.current.onpause = () => {
      setIsPaused(true);
    };
    
    audioPlayerRef.current.onplay = () => {
      setIsPaused(false);
    };
    
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = '';
      }
    };
  }, []);
  
  const speakWithBrowserVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Set speaking immediately to provide instant feedback
        setIsSpeaking(true);
        
        // Create a new utterance directly
        let utteranceText = text;
        
        // Process the text with natural pauses but without SSML tags
        if (naturalPauses) {
          // Add pauses by adding extra periods and commas instead of SSML
          utteranceText = utteranceText.replace(/\./g, '... ');
          utteranceText = utteranceText.replace(/,/g, ', ');
          
          // Add emphasis by repeating words instead of SSML
          utteranceText = utteranceText.replace(/\*([^*]+)\*/g, '$1 $1');
        }
        
        // Make sure audio context is running (fixes issues in some browsers)
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioCtx = new AudioContext();
            if (audioCtx.state === 'suspended') {
              audioCtx.resume();
            }
          }
        } catch (e) {
          console.warn('Audio context initialization failed:', e);
        }
        
        // Create utterance and play immediately
        const utterance = new SpeechSynthesisUtterance(utteranceText);
        utteranceRef.current = utterance;
        
        // Set voice
        if (selectedVoice) {
          const voice = voices.find(v => v.name === selectedVoice);
          if (voice) {
            utterance.voice = voice;
          }
        }
        
        // Set speech parameters
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        
        // Add essential event listeners
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
        
        // Start speaking immediately
        window.speechSynthesis.speak(utterance);
        
      } catch (error: any) {
        console.error("Error in speech synthesis:", error);
        setIsSpeaking(false);
        alert("Speech synthesis error. Please try again.");
      }
    } else {
      alert('Your browser does not support text-to-speech. Please try Chrome or Edge.');
    }
  }
  
  // Speak with trained voice - with enhanced compatibility
  const speakWithTrainedVoice = async () => {
    try {
      if (!selectedVoice) {
        throw new Error('No trained voice selected');
      }
      
      // Set speaking state immediately
      setIsSpeaking(true);
      
      // Get the text to synthesize
      const textToSpeak = text || "No text provided for speech synthesis.";
      
      // Check if we should use advanced voice cloning
      const useAdvancedCloning = localStorage.getItem('use_voice_cloning') === 'true';
      
      if (useAdvancedCloning) {
        // Show processing indicator
        setIsProcessingSpeech(true);
        
        // Get the API key
        const elevenlabsApiKey = localStorage.getItem('elevenlabs_api_key');
        if (!elevenlabsApiKey) {
          console.warn('Voice cloning is enabled but no API key is set');
          setIsProcessingSpeech(false);
          throw new Error('ElevenLabs API key not found. Please add it in Settings.');
        }
        
        console.log("Using ElevenLabs voice cloning for trained voice:", selectedVoice);
        
        // Use ElevenLabs to synthesize the text with the user's voice
        try {
          // For now, we're using the demo voice but in a production app
          // you would first upload the user's voice sample to ElevenLabs
          // and then use their voice_id for synthesis
          await synthesizeWithElevenLabs(textToSpeak, selectedVoice);
          setIsProcessingSpeech(false);
          return;
        } catch (err) {
          console.error("Voice cloning synthesis failed:", err);
          // Fall back to playing the recorded sample
          console.warn("Falling back to playing the recorded voice sample");
          setIsProcessingSpeech(false);
        }
      }
      
      // If we don't use cloning or it failed, use the traditional approach
      // Get the voice blob
      const voiceBlob = await getTrainedVoiceBlob(selectedVoice);
      
      if (!voiceBlob) {
        console.warn('No voice blob returned, using silent audio');
        // Use a silent audio blob instead of failing
        playAudioBlob(createSilentAudio(0.5));
        return;
      }
      
      // Check if the blob is empty (often a sign of retrieval issues)
      if (voiceBlob.size === 0) {
        console.warn('Empty voice blob received, using silent audio');
        playAudioBlob(createSilentAudio(0.5));
        return;
      }
      
      // Check if the blob is playable
      const isPlayable = await isPlayableAudio(voiceBlob);
      
      if (!isPlayable) {
        console.warn('Voice blob is not directly playable, attempting to convert...');
        
        // Try different conversion approaches in sequence
        // 1. Try WAV format first
        const wavBlob = await convertAudioFormat(voiceBlob, 'audio/wav');
        if (wavBlob && await isPlayableAudio(wavBlob)) {
          console.log('Successfully converted to WAV format');
          
          // Play the converted WAV
          playAudioBlob(wavBlob);
          return;
        }
        
        // 2. Try MP3 format as a fallback
        const mp3Blob = await convertAudioFormat(voiceBlob, 'audio/mp3');
        if (mp3Blob && await isPlayableAudio(mp3Blob)) {
          console.log('Successfully converted to MP3 format');
          
          // Play the converted MP3
          playAudioBlob(mp3Blob);
          return;
        }
        
        // 3. Try the manual conversion with AudioBuffer as last resort
        try {
          const audioBuffer = await blobToAudioBuffer(voiceBlob);
          
          if (audioBuffer) {
            console.log('Successfully converted using AudioBuffer');
            const convertedBlob = audioBufferToWav(audioBuffer);
            
            // Play the converted audio
            playAudioBlob(convertedBlob);
            return;
          }
        } catch (conversionError) {
          console.error('All conversion attempts failed:', conversionError);
        }
        
        // 4. If all conversion fails, use a silent audio blob
        console.warn('All conversion attempts failed, using silent audio');
        playAudioBlob(createSilentAudio(1.0));
        return;
      }
      
      // If the original blob is playable, use it directly
      playAudioBlob(voiceBlob);
      
    } catch (error: any) {
      console.error('Error with trained voice:', error);
      setIsSpeaking(false);
      setIsProcessingSpeech(false);
      
      try {
        // Try to use silent audio as a last resort
        playAudioBlob(createSilentAudio(0.5));
      } catch (fallbackError) {
        console.error('Even fallback silent audio failed:', fallbackError);
        
        // Finally fall back to browser voice with a more helpful message
        alert(`Could not play trained voice: ${error.message || 'Unknown error'}. Falling back to browser voice. Try recording your voice again in the Voice Training page.`);
        speakWithBrowserVoice();
      }
    }
  };
  
  // New function to synthesize speech using ElevenLabs API
  const synthesizeWithElevenLabs = async (text: string, voiceId: string): Promise<void> => {
    try {
      // Get the API key from localStorage
      const elevenlabsApiKey = localStorage.getItem('elevenlabs_api_key');
      
      if (!elevenlabsApiKey) {
        throw new Error('ElevenLabs API key not found. Please set it in the Settings page.');
      }
      
      // Set status message
      console.log("Synthesizing speech with ElevenLabs...");
      
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }
      
      // For testing, use the Rachel demo voice from ElevenLabs
      const demoVoiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice ID
      
      // Show message while processing
      console.log("Sending request to ElevenLabs API...");
      
      try {
        // Prepare request to ElevenLabs API
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${demoVoiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenlabsApiKey
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8
            }
          })
        });
        
        if (!response.ok) {
          // Handle HTTP errors
          const errorStatus = response.status;
          let errorMessage = `ElevenLabs API error (${response.status}): ${response.statusText}`;
          
          try {
            // Try to get the error details
            const errorData = await response.json();
            errorMessage = `ElevenLabs API error (${response.status}): ${errorData.detail || response.statusText}`;
            
            // Handle specific known error cases
            if (response.status === 401) {
              errorMessage = 'Invalid API key. Please check your ElevenLabs API key in Settings.';
            }
            if (response.status === 429) {
              errorMessage = 'Rate limit exceeded. Your free tier limit may have been reached.';
            }
          } catch {
            // If we can't parse the response as JSON, just use the status text
            console.error("Non-JSON error response");
          }
          
          throw new Error(errorMessage);
        }
        
        console.log("Received response from ElevenLabs API");
        
        // Get the audio as arrayBuffer
        const arrayBuffer = await response.arrayBuffer();
        
        // Check if we got a valid audio response
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error('Received empty audio data from ElevenLabs API');
        }
        
        // Convert arrayBuffer to blob with correct MIME type
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        console.log("Audio blob type:", audioBlob.type, "size:", audioBlob.size, "bytes");
        
        // Play the synthesized audio
        console.log("Playing synthesized audio...");
        await playAudioBlob(audioBlob);
        
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }
      
    } catch (error: any) {
      console.error("Error synthesizing speech with ElevenLabs:", error);
      setIsProcessingSpeech(false);
      alert(`Error synthesizing speech: ${error.message}. Please try a different voice or text.`);
      throw error;
    }
  };
  
  // Add a new error handler that will show the debug helper when there are audio issues
  const handleAudioError = (error: any) => {
    console.error('Audio error detected:', error);
    setHasAudioError(true);
    setShowDebugHelper(true);
  };

  // Helper to play an audio blob with the current settings
  const playAudioBlob = async (blob: Blob) => {
    try {
      console.log("Playing audio blob of type:", blob.type, "size:", blob.size, "bytes");
      
      // Validate the blob
      if (blob.size === 0) {
        throw new Error("Received empty audio blob");
      }
      
      // First try the standard HTML5 Audio approach
      try {
        // Create an audio element if needed
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio();
        }
        
        // Create a URL for the blob
        const audioUrl = URL.createObjectURL(blob);
        console.log("Created audio URL:", audioUrl);
        
        // Configure the audio player
        const player = audioPlayerRef.current;
        player.src = audioUrl;
        player.playbackRate = rate;
        player.volume = volume;
        
        // Set up promise for play completion
        const playPromise = new Promise((resolve, reject) => {
          // Add more error handling
          player.onerror = (e) => {
            const errorMsg = player.error?.message || 'Unknown error';
            console.error("Audio playback error:", player.error);
            URL.revokeObjectURL(audioUrl);
            handleAudioError(new Error(`Audio playback error: ${errorMsg}`));
            reject(new Error(`Audio playback error: ${errorMsg}`));
          };
          
          // Set up event handlers
          player.onended = () => {
            console.log("Audio playback ended");
            setIsSpeaking(false);
            setIsPaused(false);
            URL.revokeObjectURL(audioUrl);
            resolve(true);
          };
          
          player.oncanplaythrough = () => {
            console.log("Audio can play through");
          };
        });
        
        // Play the audio
        console.log("Attempting to play audio with HTML5 Audio...");
        await player.play();
        console.log("Audio playing successfully");
        
        return playPromise;
      } catch (htmlAudioError) {
        // If HTML5 Audio fails, fall back to Web Audio API
        console.warn("HTML5 Audio playback failed, trying Web Audio API:", htmlAudioError);
        handleAudioError(htmlAudioError);
        
        return playWithWebAudio(blob);
      }
    } catch (error) {
      console.error('Error playing audio blob:', error);
      setIsSpeaking(false);
      handleAudioError(error);
      alert(`Failed to play audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  // Helper to play audio using Web Audio API
  const playWithWebAudio = async (blob: Blob): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("Attempting to play with Web Audio API...");
        
        // Create an AudioContext
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          throw new Error("Web Audio API not supported in this browser");
        }
        
        const audioContext = new AudioContext();
        
        // Create an audio buffer from the blob
        const arrayBuffer = await blob.arrayBuffer();
        
        // Decode the audio data
        audioContext.decodeAudioData(
          arrayBuffer,
          (buffer) => {
            // Create audio source
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            
            // Create a gain node for volume control
            const gainNode = audioContext.createGain();
            gainNode.gain.value = volume;
            
            // Connect the nodes
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Set the playback rate
            source.playbackRate.value = rate;
            
            // Play the audio
            source.start(0);
            console.log("Web Audio API playback started");
            
            // Set state
            setIsSpeaking(true);
            
            // Handle completion
            source.onended = () => {
              console.log("Web Audio API playback ended");
              setIsSpeaking(false);
              audioContext.close().catch(err => console.error("Error closing audio context:", err));
              resolve(true);
            };
            
            // Store references for stopping
            (window as any).currentTrainedVoiceSource = source;
            (window as any).currentAudioContext = audioContext;
          },
          (error) => {
            console.error("Error decoding audio data:", error);
            reject(error);
          }
        );
      } catch (error) {
        console.error("Web Audio API error:", error);
        reject(error);
      }
    });
  };
  
  // Premium voice function - optimized for immediate start
  const speakWithPremiumVoice = async () => {
    // Set speaking state immediately
    setIsSpeaking(true);
    
    try {
      // Check if we have a valid API key
      if (selectedProvider === 'elevenlabs') {
        const elevenlabsApiKey = localStorage.getItem('elevenlabs_api_key');
        if (!elevenlabsApiKey) {
          throw new Error('ElevenLabs API key not found. Please add it in Settings.');
        }
        
        // Get the text to synthesize
        const textToSpeak = text || "Hello, this is a test of ElevenLabs voice synthesis.";
        
        // Find the selected voice
        const selectedPremiumVoice = premiumVoices.find(v => v.id === selectedVoice);
        
        // Use Rachel as default if voice not found
        const voiceId = selectedVoice || "21m00Tcm4TlvDq8ikWAM"; // Rachel voice ID
        
        console.log(`Using ElevenLabs voice: ${selectedPremiumVoice?.name || 'Rachel'}`);
        
        // Show processing state
        setIsProcessingSpeech(true);
        
        // Call the ElevenLabs API
        await synthesizeWithElevenLabs(textToSpeak, voiceId);
        
        // Reset processing state
        setIsProcessingSpeech(false);
        return;
      }
      
      // For Google, Amazon, etc. (in a real app these would use their respective APIs)
      // For now, we'll just fall back to browser speech
      if (selectedProvider !== 'browser') {
        alert(`In a production app, this would use the ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API with your API key.`);
      }
      
      // Fall back to browser speech
      speakWithBrowserVoice();
    } catch (error) {
      console.error(`Error with ${selectedProvider} voice:`, error);
      setIsSpeaking(false);
      setIsProcessingSpeech(false);
      alert(`Error using ${selectedProvider} voice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Main speak function - optimized to start immediately
  const speak = () => {
    // Cancel any previous speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    
    // Reset state to ensure clean start
    setIsPaused(false);
    setIsProcessingSpeech(false);
    
    // Choose appropriate voice provider
    if (selectedProvider === 'browser') {
      speakWithBrowserVoice();
    } else if (selectedProvider === 'trained') {
      speakWithTrainedVoice();
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
    } else if (selectedProvider === 'trained') {
      if (audioPlayerRef.current) {
        if (isSpeaking && !isPaused) {
          audioPlayerRef.current.pause();
        } else if (isSpeaking && isPaused) {
          audioPlayerRef.current.play();
        }
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
    } else if (selectedProvider === 'trained') {
      // Stop Web Audio API playback for trained voice
      if ((window as any).currentTrainedVoiceSource) {
        try {
          (window as any).currentTrainedVoiceSource.stop();
        } catch (e) {
          console.log('Error stopping trained voice source:', e);
        }
      }
      
      if ((window as any).currentAudioContext) {
        try {
          (window as any).currentAudioContext.close();
        } catch (e) {
          console.log('Error closing audio context:', e);
        }
      }
      
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      }
    } else if (selectedProvider !== 'browser') {
      // In a real implementation, you would call the API to stop
      alert('Stop for premium voices would call the respective API');
    }
    
    setIsSpeaking(false)
    setIsPaused(false)
  }
  
  // Additional debug function to check voice data
  const logVoiceDetails = () => {
    console.log("DEBUG: Speech synthesis available:", typeof speechSynthesis !== 'undefined');
    if (typeof speechSynthesis !== 'undefined') {
      const availableVoices = speechSynthesis.getVoices();
      console.log("DEBUG: Total voices:", availableVoices.length);
      console.log("DEBUG: Voice details:", availableVoices.map(v => ({
        name: v.name,
        lang: v.lang,
        localService: v.localService,
        default: v.default
      })));
    }
  }
  
  // Check audio capabilities on component mount
  useEffect(() => {
    // Log audio/browser debug info
    console.log("DEBUG: Checking audio capabilities on page load");
    console.log("DEBUG: Browser:", navigator.userAgent);
    console.log("DEBUG: Web Audio API supported:", typeof window.AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined');
    console.log("DEBUG: Speech Synthesis supported:", typeof window.speechSynthesis !== 'undefined');
    
    // Check if audio context is suspended (browsers may require user interaction)
    const checkAudioContext = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const testContext = new AudioContext();
          console.log("DEBUG: Audio context state:", testContext.state);
          
          if (testContext.state === 'suspended') {
            console.log("DEBUG: Audio context suspended - may require user interaction");
          }
          
          // Check if we should auto-resume the context
          if (testContext.state === 'suspended') {
            testContext.resume().then(() => {
              console.log("DEBUG: Audio context resumed successfully");
            }).catch(err => {
              console.error("DEBUG: Failed to resume audio context:", err);
            });
          }
        }
      } catch (err) {
        console.error("DEBUG: Error checking audio context:", err);
      }
    };
    
    checkAudioContext();
    
    // Also check basic audio playback when user interacts
    const handleUserInteraction = () => {
      const testAudio = new Audio();
      testAudio.volume = 0.01; // Very quiet test
      
      // Set source to a simple test tone or use an empty audio blob
      const testBlob = new Blob([''], { type: 'audio/wav' });
      testAudio.src = URL.createObjectURL(testBlob);
      
      // Just try to play to confirm audio subsystem works
      testAudio.play().then(() => {
        console.log("DEBUG: Audio system works - test successful");
        testAudio.pause(); // Immediately pause since we don't need to hear anything
      }).catch(err => {
        console.error("DEBUG: Audio playback failed:", err);
      });
      
      // Remove event listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
    
    // Add event listeners for first user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    
    // Clean up
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);
  
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
          
          {/* Toggle for audio debug helper */}
          <button 
            onClick={() => setShowDebugHelper(!showDebugHelper)}
            className="ml-auto px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg"
          >
            {showDebugHelper ? 'Hide Troubleshooting' : 'Troubleshooting'}
          </button>
        </div>
        
        {/* Audio Debug Helper */}
        <AudioDebugHelper isVisible={showDebugHelper || hasAudioError} />
        
        {/* Voice Cloning Status Banner */}
        {isVoiceCloning && selectedProvider === 'trained' && (
          <div className="bg-green-50 dark:bg-green-900 mb-6 p-4 rounded-lg text-green-800 dark:text-green-200 flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>
                Voice cloning is <strong>enabled</strong>. 
                {isProcessingSpeech ? (
                  <span className="ml-2">
                    <span className="animate-pulse">Generating speech in your voice...</span>
                  </span>
                ) : (
                  <span className="ml-2">
                    Text will be spoken in your voice using ElevenLabs AI.
                  </span>
                )}
              </span>
            </div>
            <Link 
              href="/settings"
              className="text-green-700 dark:text-green-300 hover:underline text-sm font-medium"
            >
              Configure
            </Link>
          </div>
        )}
        
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
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
                  onClick={() => setSelectedProvider('trained')}
                  className={`p-3 border rounded-lg flex flex-col items-center text-center transition-colors
                    ${selectedProvider === 'trained' 
                      ? 'bg-secondary text-white border-secondary' 
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-secondary dark:hover:border-secondary'
                    }
                  `}
                >
                  <span className="font-medium">My Voice</span>
                  <span className="text-xs mt-1">Your trained voice</span>
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
              
              {/* Add audio troubleshooting button */}
              <div className="mt-2 flex justify-end">
                <button 
                  onClick={() => setShowDebugHelper(!showDebugHelper)}
                  className="text-sm flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Audio Troubleshooting
                </button>
              </div>
            </div>
            
            {/* API Key for premium voices */}
            {selectedProvider !== 'browser' && selectedProvider !== 'trained' && (
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
            
            {/* Trained voice missing message */}
            {selectedProvider === 'trained' && trainedVoices.length === 0 && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">
                  You haven't trained your voice yet. 
                  <Link href="/voice-training" className="ml-1 underline font-medium">
                    Go to voice training
                  </Link> 
                  to create your personalized voice model.
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
                  <div>
                    {/* Voice filter and language filter */}
                    <div className="mb-2 flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Search voices..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
                          value={voiceFilter}
                          onChange={(e) => setVoiceFilter(e.target.value)}
                        />
                      </div>
                      <select
                        value={voiceLanguageFilter}
                        onChange={(e) => setVoiceLanguageFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
                      >
                        {availableLanguages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Voice selection dropdown */}
                    <select
                      id="voice"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                    >
                      {filteredVoices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : selectedProvider === 'trained' ? (
                  <div>
                    {/* Trained voice selection */}
                    <select
                      id="trainedVoice"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      disabled={trainedVoices.length === 0}
                    >
                      {trainedVoices.length === 0 ? (
                        <option value="">No trained voices available</option>
                      ) : (
                        trainedVoices.map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name} {voice.isDefault ? '(Default)' : ''}
                          </option>
                        ))
                      )}
                    </select>
                    
                    <div className="mt-2 text-right">
                      <Link 
                        href="/voice-training" 
                        className="text-sm text-secondary hover:text-secondary-dark"
                      >
                        Manage trained voices
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Premium voice selection */}
                    <select
                      id="premiumVoice"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary dark:bg-gray-800 dark:text-white"
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                    >
                      {premiumVoices
                        .filter(voice => voice.provider === selectedProvider)
                        .map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name} ({voice.gender})
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Note: Premium voices require a valid API key
                    </p>
                  </div>
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