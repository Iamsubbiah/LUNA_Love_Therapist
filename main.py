import os
import sys
import time
import webbrowser
import subprocess
import signal
from threading import Timer

def check_dependencies():
    """Check if all required dependencies are installed"""
    required_packages = ['flask', 'google.generativeai', 'speech_recognition', 'pyttsx3']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.split('.')[0])
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("\n❌ Missing required dependencies:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\nPlease install them using:")
        print("pip install -r requirements.txt")
        return False
    return True

def open_browser():
    """Open the default web browser to the application URL"""
    try:
        webbrowser.open_new('http://localhost:5000')
        print("Browser opened to http://localhost:5000")
    except Exception as e:
        print(f"Could not open browser automatically: {e}")
        print("Please manually open http://localhost:5000 in your browser")

def handle_exit(signum, frame):
    """Handle exit signals gracefully"""
    print("\n\nShutting down server...")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, handle_exit)
signal.signal(signal.SIGTERM, handle_exit)

# Check if model version needs to be updated
try:
    # First check if dependencies are installed
    if not check_dependencies():
        sys.exit(1)
        
    import website.app as app_module
    
    if hasattr(app_module, 'model'):
        if 'gemini-2.0-flash' in str(app_module.model):
            print("Updating Gemini model version...")
            import google.generativeai as genai
            app_module.model = genai.GenerativeModel('gemini-1.5-flash')
            app_module.chat = app_module.model.start_chat()
            app_module.setup_luna()
            print("Model updated successfully!")
except ImportError as e:
    print(f"\n❌ Error importing modules: {e}")
    print("Make sure you're running this script from the project root directory.")
    sys.exit(1)

if __name__ == "__main__":
    try:
        print("\n=======================================")
        print("   Luna Love Therapist - Starting Up   ")
        print("=======================================\n")
        print("Made with ❤️ by Subu")
        print("\nStarting Flask server...")
        
        # Open browser after a short delay
        Timer(2.0, open_browser).start()
        
        # Start the Flask application with debug mode off for better restart handling
        app_module.app.run(debug=False, host='0.0.0.0', port=5000)
        
    except KeyboardInterrupt:
        print("\nShutting down server...")
        sys.exit(0)
    except OSError as e:
        if "Address already in use" in str(e):
            print("\n❌ Error: Port 5000 is already in use.")
            print("This may mean the server is already running or another application is using port 5000.")
            print("Try closing other applications or restart your computer.")
        else:
            print(f"\n❌ Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("Check if all dependencies are installed with 'pip install -r requirements.txt'")
        sys.exit(1) 