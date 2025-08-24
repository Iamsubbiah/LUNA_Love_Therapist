# Luna - Your 3D Gen Z Love Therapist

Luna is a cutting-edge, 3D-enhanced love therapist chatbot that combines modern web technologies with AI-powered conversation. Luna provides love advice in a friendly, Gen Z style through an immersive experience with both text and voice interaction capabilities.

## Key Features

- 🌟 **Beautiful 3D Interface**: Stunning animated heart model with dynamic particles, lighting, and effects
- 🎙️ **Seamless Conversation**: 
  - Auto-mic mode for natural back-and-forth conversation
  - Type or speak to Luna with intuitive controls
  - Voice output for a hands-free experience
- 🌓 **Dark/Light Mode**: Toggle between themes for comfortable viewing
- 💬 **Authentic Gen Z Style**: Natural, modern advice in Gen Z language
- 🎯 **Interactive Elements**: Custom cursor effects and tilt animations
- 📱 **Fully Responsive**: Works on all devices and screen sizes
- 🔄 **Smart Restart**: Automatic port handling and recovery capabilities

## Technologies

- **Frontend**: HTML5, CSS3, JavaScript with Three.js for 3D graphics
- **Backend**: Flask (Python)
- **AI**: Google Gemini LLM for natural language processing
- **Speech**: Web Speech API and SpeechRecognition for bidirectional voice interaction

## Installation

### Prerequisites

- Python 3.8 or higher
- Pip (Python package installer)
- A modern web browser (Chrome recommended for best voice support)

### Setup

1. Clone or download this repository:
   ```
   git clone <repository-url>
   cd Luna-Love-Therapist
   ```

2. Install the dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Replace the API key:
   - Open `website/app.py`
   - Replace the `YOUR_API_KEY` value with your own Google Gemini API key

## Running Luna

Simply run:
```
python run.py
```

The server will start and automatically:
- Check for required dependencies
- Handle any port conflicts by attempting to free port 5000
- Open a browser window to `http://localhost:5000`

## Usage Guide

### Input Methods

- **Type**: Use the text input area to type your messages
- **Speak**: Click the microphone button to start/stop recording your voice
- **Auto-Mic Mode**: Enable the auto-mic toggle (microphone-alt icon) in the header to have Luna automatically listen for your response after she speaks

### Output Methods

- **Text**: Read Luna's responses in the chat
- **Voice**: Toggle voice output to have Luna speak her responses aloud

### Seamless Conversation Mode

- Enable both voice output and auto-mic for a completely hands-free experience
- When Luna finishes speaking, the microphone will automatically activate
- Speak your response and Luna will reply, creating a natural conversation flow
- A subtle indicator shows when the mic is listening

### Dark Mode

- Toggle the switch in the top-right corner to switch between light and dark themes
- The 3D heart and environment adapt to the selected theme

## Troubleshooting

### Port Issues

- If you see "Port 5000 is already in use" but the app isn't running:
  - The script will attempt to automatically free the port
  - You'll be prompted whether to continue if automatic freeing fails
  - Try restarting your computer if persistent issues occur
  - You can manually kill processes using port 5000 with Task Manager (Windows) or Activity Monitor (Mac)

### Voice Input Issues

- Ensure you've granted microphone permissions in your browser
- Try different browsers if voice input isn't working (Chrome has best support)
- Check that your microphone is working properly and not muted
- If auto-mic mode isn't working correctly, try toggling it off and on again

### Voice Output Issues

- Make sure your speakers are on and volume is up
- Some browsers have limited voice synthesis capability - try Chrome for best results

### API Key Issues

- If you see errors about the Gemini API, make sure your API key is valid and has proper permissions
- Ensure your API key has access to the Gemini model being used

### Connection Problems

- If the application crashes on restart, the script now handles this gracefully
- The port conflict resolution should prevent most restart issues
- Check your internet connection if experiencing API timeout issues

## Credits

- Created by Subu
- 3D heart model created with Three.js
- UI design inspired by modern web applications