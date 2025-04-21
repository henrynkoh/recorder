# Voice Recorder Web App

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.0.0-black)
![React](https://img.shields.io/badge/React-18.0.0-61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0.0-38B2AC)

A simple, privacy-focused web application for recording and playing back audio directly in your browser. Voice Recorder provides a modern, intuitive interface for capturing audio without the need for downloads, installations, or account creation.

![Voice Recorder Screenshot](public/screenshot.jpg)

## 🎯 Features

- **Simple Recording** - Start recording audio with a single click
- **Instant Playback** - Listen to your recordings immediately
- **Sleek Design** - Modern, responsive interface with light and dark mode support
- **Accessibility** - No downloads or account creation required
- **Privacy First** - All recordings stay in your browser, with no server uploads
- **Device Support** - Works on desktop and mobile browsers
- **Offline Use** - Can be used without an internet connection after initial load
- **Easy Organization** - Search, rename, and manage your recordings

## 🚀 Getting Started

### Prerequisites

- Node.js 16.0.0 or later
- npm or yarn

### Installation

1. Clone this repository
   ```bash
   git clone https://github.com/henrynkoh/recorder.git
   cd recorder
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser to `http://localhost:3000`

### Production Build

To create a production build:

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## 💻 Usage

1. **Recording Audio**
   - Click the microphone button to start recording
   - Click pause to temporarily stop recording
   - Click stop to complete your recording

2. **Managing Recordings**
   - All recordings appear in the "My Recordings" section
   - Click on any recording to play it back
   - Use the search function to find specific recordings
   - Rename or delete recordings as needed

3. **Settings**
   - Toggle between light and dark mode in the settings menu
   - Adjust audio quality settings as needed

## 🧰 Technology Stack

Built with modern web technologies:

- **Framework**: [Next.js](https://nextjs.org/) - React framework for production
- **UI Library**: [React](https://reactjs.org/) - Frontend JavaScript library
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Language**: [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- **Web Audio**: Web Audio API and MediaRecorder API

## 🔒 Privacy

The Voice Recorder app is designed with privacy as a core principle:

- All audio processing occurs locally in your browser
- No data is transmitted to external servers
- Recordings are stored using browser localStorage/IndexedDB
- No analytics or tracking scripts
- No data collection of any kind

## 👥 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's style guidelines and includes appropriate tests.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📚 Documentation

For more detailed information:

- [User Manual](docs/USER_MANUAL.md)
- [Quick Start Guide](docs/QUICKSTART.md)
- [Tutorials](docs/TUTORIAL.md)

## 📞 Contact

Have questions or feedback? Reach out to us:

- Create an issue on this repository
- Email: feedback@voicerecorder.app 