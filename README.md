# Voice Recorder App

A modern, easy-to-use voice recording application built with Next.js, React, and TypeScript.

![Voice Recorder Screenshot](public/screenshot.png)

## Features

- ✨ Clean, intuitive interface
- 🎙️ High-quality audio recording
- ⏯️ Pause and resume recording functionality
- 📝 Name and organize your recordings
- 🔍 Search through your recordings
- 🌗 Light and dark mode support
- 💾 Offline storage with IndexedDB
- 📱 Responsive design for desktop and mobile

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/voice-recorder.git
cd voice-recorder
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Recording Audio

1. Navigate to the "Record" page
2. Enter a name for your recording (optional)
3. Click the record button to start recording
4. Use the pause button to pause/resume
5. Click stop when finished

### Managing Recordings

- All recordings are saved to your device automatically
- View your recordings on the "My Recordings" page
- Search for specific recordings using the search bar
- Play, edit, or delete recordings as needed

## Technical Details

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Storage**: IndexedDB for audio blobs, localStorage for metadata
- **Audio Processing**: Web Audio API

## Privacy

Voice Recorder respects your privacy:
- All recordings are stored locally on your device
- No data is sent to any server
- No analytics or tracking

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 