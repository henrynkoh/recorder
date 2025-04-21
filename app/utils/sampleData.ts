// sampleData.ts - Utility to initialize the app with sample data
import { storeAudioBlob } from './audioStorage';

// Sample recording IDs
const SAMPLE_IDS = ['sample_1', 'sample_2', 'sample_3'];

// Function to load sample audio file and store it in IndexedDB
export const initSampleRecordings = async (): Promise<void> => {
  try {
    // Fetch the sample audio file
    const response = await fetch('/demo-audio.mp3');
    
    if (!response.ok) {
      throw new Error('Failed to fetch sample audio');
    }
    
    const audioBlob = await response.blob();
    
    // Store the audio blob for each sample recording ID
    for (const id of SAMPLE_IDS) {
      await storeAudioBlob(id, audioBlob);
    }
    
    console.log('Sample recordings initialized successfully');
  } catch (error) {
    console.error('Failed to initialize sample recordings:', error);
  }
};

// Sample recordings data
export const sampleRecordings = [
  {
    id: 'sample_1',
    name: 'Welcome to Voice Recorder',
    duration: 45,
    date: new Date(Date.now() - 86400000 * 2), // 2 days ago
    url: ''
  },
  {
    id: 'sample_2',
    name: 'Recording Demo',
    duration: 30,
    date: new Date(Date.now() - 86400000), // 1 day ago
    url: ''
  },
  {
    id: 'sample_3',
    name: 'Voice Memo Example',
    duration: 25,
    date: new Date(),
    url: ''
  }
]; 