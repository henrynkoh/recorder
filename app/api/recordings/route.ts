import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Mock database
let recordings = [
  {
    id: '1',
    name: 'Meeting with Team',
    duration: 125, // 2:05
    date: new Date('2023-09-12T10:30:00'),
    url: '/demo-audio.mp3' // In a real app, this would be a real URL
  },
  {
    id: '2',
    name: 'Voice Note - Project Ideas',
    duration: 60, // 1:00
    date: new Date('2023-09-11T15:45:00'),
    url: '/demo-audio.mp3'
  },
  {
    id: '3',
    name: 'Interview with John',
    duration: 300, // 5:00
    date: new Date('2023-09-10T09:15:00'),
    url: '/demo-audio.mp3'
  }
]

// GET /api/recordings
export async function GET() {
  // In a real app, we would fetch from a database
  return NextResponse.json(recordings)
}

// POST /api/recordings
export async function POST(request: NextRequest) {
  const data = await request.json()
  
  const newRecording = {
    id: uuidv4(),
    name: data.name || `Recording ${new Date().toLocaleString()}`,
    duration: data.duration || 0,
    date: new Date(),
    url: data.url || '/demo-audio.mp3'
  }
  
  // In a real app, we would save to a database
  recordings.push(newRecording)
  
  return NextResponse.json(newRecording, { status: 201 })
}

// PUT /api/recordings
export async function PUT(request: NextRequest) {
  const data = await request.json()
  
  // Find and update the recording
  const index = recordings.findIndex(rec => rec.id === data.id)
  
  if (index === -1) {
    return NextResponse.json(
      { error: 'Recording not found' },
      { status: 404 }
    )
  }
  
  // Update recording (preserving id and date)
  recordings[index] = {
    ...recordings[index],
    name: data.name || recordings[index].name,
    duration: data.duration || recordings[index].duration,
    url: data.url || recordings[index].url
  }
  
  return NextResponse.json(recordings[index])
}

// DELETE /api/recordings
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  
  if (!id) {
    return NextResponse.json(
      { error: 'Recording ID is required' },
      { status: 400 }
    )
  }
  
  // Find and remove the recording
  const initialLength = recordings.length
  recordings = recordings.filter(rec => rec.id !== id)
  
  if (recordings.length === initialLength) {
    return NextResponse.json(
      { error: 'Recording not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({ success: true })
} 