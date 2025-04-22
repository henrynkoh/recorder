# Voice Recorder App - Installation Guide for Testers

Thank you for helping test the Voice Recorder app before its official launch! This guide will help you set up and run the app on your computer.

## Option 1: Run from the Zip File (Easiest)

1. **Download the zip file** (`voice-recorder-app.zip`) that was sent to you
2. **Extract the zip file** to any location on your computer
3. **Open the extracted folder**
4. There are two ways to run the app:
   
   a. **Using a simple web server** (recommended):
      - If you have Python installed:
        - Open a terminal/command prompt in the extracted folder
        - Run `python -m http.server 8000` (for Python 3) or `python -m SimpleHTTPServer 8000` (for Python 2)
        - Open your browser and navigate to `http://localhost:8000`
   
   b. **Directly from the file system**:
      - Open the `index.html` file in your browser by double-clicking it
      - Note: Some browsers may have security restrictions that limit functionality when opening directly from files

## Option 2: Run the Development Version (For Technical Users)

If you're comfortable with development tools and want the full experience:

1. **Prerequisites**:
   - Install [Node.js](https://nodejs.org/) (version 16 or higher)
   - Install [Git](https://git-scm.com/downloads)

2. **Clone the repository**:
   ```
   git clone https://github.com/henrynkoh/recorder.git
   cd recorder
   ```

3. **Install dependencies**:
   ```
   npm install
   ```

4. **Run the development server**:
   ```
   npm run dev
   ```

5. **Open the app** in your browser at `http://localhost:3000`

## Important Notes for Testing

- **Microphone Access**: You'll need to grant microphone access when prompted
- **Browser Compatibility**: Best experienced in Chrome, Firefox, or Edge
- **Data Privacy**: All recordings are stored only in your browser's local storage and are not uploaded anywhere
- **Clear Data**: If you want to start fresh, you can clear your browser's local storage or use incognito mode

## Reporting Issues

Please report any issues you encounter with:
1. Your browser and version
2. Your operating system
3. Steps to reproduce the issue
4. What you expected to happen
5. What actually happened
6. Screenshots (if applicable)

Send feedback to: henrynkoh@gmail.com

## Known Limitations

- Internet connection is required for initial loading (Option 1b doesn't have this limitation)
- Works best on desktop browsers; mobile support is still being refined
- Some advanced features might be limited when running directly from files

Thank you for your help improving the Voice Recorder app! 