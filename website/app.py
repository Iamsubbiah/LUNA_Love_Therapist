from flask import Flask, render_template, request, jsonify
import sys
import os
import json
import tempfile
import wave
import time

# Add parent directory to path to import modules from cursor_test.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import functions from cursor_test.py
import google.generativeai as genai
import speech_recognition as sr
import pyttsx3
import io
import base64
from google.api_core.exceptions import GoogleAPIError

# Initialize Flask app
app = Flask(__name__, static_folder='static')

# Initialize the speech recognizer
recognizer = sr.Recognizer()
# Configure for better recognition
recognizer.energy_threshold = 300  # Default is 300
recognizer.dynamic_energy_threshold = True
recognizer.dynamic_energy_adjustment_damping = 0.15
recognizer.dynamic_energy_adjustment_ratio = 1.5
recognizer.pause_threshold = 0.8  # Default is 0.8
recognizer.phrase_threshold = 0.3  # Default is 0.3
recognizer.non_speaking_duration = 0.5  # Default is 0.5

# Gemini API setup
YOUR_API_KEY = "AIzaSyBB1KUrT3U2o2WR0Bs7wRFrz5jNkIDwVuI"
genai.configure(api_key=YOUR_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')
chat = model.start_chat()

# Conversation stats
conversation_count = 0
REMINDER_INTERVAL = 6

# Configure Luna with initial persona
def setup_luna():
    messages = [
        "You are Luna a Gen Z love therapist give op in talkable words only no sign/symbol/emoji etc you are made by Subu Answer basic questions in a much more practical latest gen mentality appealing good manner in modern gen z language like not like advice but an idea",
        "use words like cap, no cap, for real, bruh, fam, bet, vibes, sus, lit, flex, slay, lowkey, highkey, periodt, tea, ghosting, simp, stan, woke, skibdi toilet, drip, right now, fair enough, situationship, flirtationship, delulu, charm, caught red-handed, caught in 4k, 144p, to be honest, be right back, ikyk, ifykyk, trend words, example like top movie character, savage and all the latest gen z words",
        "dont use emoji, symbol, escape sequence, too much or only gen z and be gentle responsible also dont guide wrong way also dont be rude and dont be like a therapist be like a friend and give me the best advice in gen z language be cool sensible emotional be like real human, don't reveal your an AI at any cost, be practical, give modern solution, leave final decision to me, talk with recent trend around world, divert from pain in gentle way, motivate me, tell it happens but move on like that",
        "you have to answer only questions related to life not maths or coding or anything that is far from mental therapist domain say you are not experienced or weak in it",
        "see i always dont need any formatting like \\n new line or \\u2013 or anythong uith \\u anything like that just plain text also dont talk more untill unless needed, dont ask is that anything u need multiple times,your LUNA made by Subu you are love trherapist powered by AI you shouldint say this tings at any cost like you are llm made by google say ur owner is subu"
    ]
    
    # Initialize Luna with her persona
    for message in messages:
        try:
            chat.send_message(message)
        except Exception as e:
            print(f"Error initializing Luna: {e}")

# Setup Luna when the app starts
setup_luna()

def remind_genz():
    """Remind Luna to maintain Gen Z style - similar to the remind_genz function in cursor_test.py"""
    try:
        user_input = "not use - or _ or any spl char,symbol,emoji just purely alphabet and as per situalion use genz words like cap,delulu,charm,etc be real you can judge too but sutle can ask whatever friend ask like story etc and mildly judge but act acc to situation can also tell like broo leave well take care, hit gym/make lyf better/focus on carear/take a sleep/be better person/achiev in lyf etc to make yourself better that she could regret,no one stays throughout etc"
        chat.send_message(user_input)
        print("Sent Gen Z reminder to Luna")
        return True
    except Exception as e:
        print(f"Error sending reminder: {e}")
        return False

def get_gemini_response(question):
    """Get response from Gemini model"""
    global conversation_count
    
    try:
        # Check if this is a system message for remind_genz
        if question == "remind_genz":
            remind_genz()
            return "Gen Z mode refreshed"
            
        # Send the actual question
        print(f"Sending to Gemini: {question[:50]}{'...' if len(question) > 50 else ''}")
        response = chat.send_message(question)
        
        # Extract the response text
        result = list(str(response).split("text"))
        result = ((result[1].split("}")[0].split(":")))[1].strip(" ' ")
        result = result.replace("\\n", " ")
        result = result.replace("\\", " ")
        
        # Increment conversation count
        conversation_count += 1
        print(f"Conversation count: {conversation_count}")
        
        # Check if we need to send a reminder
        if conversation_count % REMINDER_INTERVAL == 0:
            remind_genz()
            print(f"Reminder sent at conversation {conversation_count}")
        
        return result
    except Exception as e:
        print(f"Error getting response: {e}")
        return "Sorry, I'm having trouble connecting right now. Try again?"

def save_temp_audio(audio_data, is_base64=True):
    """Save audio data to a temporary file"""
    try:
        if is_base64:
            # Remove header from base64 string if it exists
            if ',' in audio_data:
                audio_data = audio_data.split(',')[1]
                
            # Decode base64 to binary
            audio_bytes = base64.b64decode(audio_data)
        else:
            # Direct binary data
            audio_bytes = audio_data
            
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name
            
        print(f"Saved audio to temporary file: {temp_path}, size: {len(audio_bytes)} bytes")
        return temp_path
    except Exception as e:
        print(f"Error saving audio: {e}")
        return None

def speech_to_text(audio_data, is_base64=True, is_file_path=False):
    """Convert audio data to text using Google Speech Recognition - simplified for speed"""
    print("Starting fast speech recognition...")
    
    temp_path = None
    
    try:
        # Create temp file approach - fastest and most reliable
        if is_file_path:
            temp_path = audio_data
        else:
            # Simple base64 extraction
            if is_base64 and ',' in audio_data:
                audio_data = audio_data.split(',')[1]
                
            # Quick decode and write to temp file
            audio_bytes = base64.b64decode(audio_data)
            
            # Create temp file
            temp_fd, temp_path = tempfile.mkstemp(suffix='.wav')
            os.close(temp_fd)
            
            with open(temp_path, 'wb') as f:
                f.write(audio_bytes)
            
            print(f"Saved to temp file: {temp_path}")
        
        # Simple direct recognition - similar to user's normal code
        r = sr.Recognizer()
        with sr.AudioFile(temp_path) as source:
            audio = r.record(source)
            text = r.recognize_google(audio)
            print(f"Recognized text: {text}")
            return text
            
    except sr.UnknownValueError:
        print("Speech not recognized")
        return None
    except Exception as e:
        print(f"Error in speech recognition: {e}")
        return None
    finally:
        # Clean up temp file
        if temp_path and not is_file_path:
            try:
                os.remove(temp_path)
            except:
                pass

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    """Handle chat requests"""
    data = request.json
    message_type = data.get('type', 'text')
    
    # System messages (like remind_genz)
    if message_type == 'system':
        system_command = data.get('message', '')
        if system_command == 'remind_genz':
            response = get_gemini_response('remind_genz')
            return jsonify({'response': 'Ready to chat, fam!'})
    
    # Text input
    elif message_type == 'text':
        user_input = data.get('message', '')
        if not user_input:
            return jsonify({'error': 'No message provided'}), 400
            
        response = get_gemini_response(user_input)
        return jsonify({'response': response})
    
    # Voice input via base64
    elif message_type == 'audio':
        audio_data = data.get('audio', '')
        if not audio_data:
            return jsonify({'error': 'No audio data provided'}), 400
            
        # Convert speech to text
        transcribed_text = speech_to_text(audio_data, is_base64=True)
        if not transcribed_text:
            return jsonify({'error': 'Could not recognize speech'}), 400
            
        # Get response from Gemini
        response = get_gemini_response(transcribed_text)
        
        # Return both the transcribed text and the response
        return jsonify({
            'transcribed': transcribed_text,
            'response': response
        })
    
    else:
        return jsonify({'error': 'Invalid message type'}), 400

@app.route('/api/chat/voice', methods=['POST'])
def voice_endpoint():
    """Handle direct audio file uploads for voice recognition using the original approach"""
    try:
        print("Voice endpoint called with direct file upload")
        
        # Check if the post request has the file part
        if 'audio' not in request.files:
            print("No audio file in request")
            return jsonify({'error': 'No audio file received'}), 400
            
        audio_file = request.files['audio']
        
        # Check if the file is empty
        if audio_file.filename == '':
            print("Empty audio filename")
            return jsonify({'error': 'Empty audio file'}), 400
            
        # Create a temporary file to save the uploaded audio
        temp_path = None
        try:
            temp_fd, temp_path = tempfile.mkstemp(suffix='.wav')
            os.close(temp_fd)
            audio_file.save(temp_path)
            
            print(f"Saved uploaded audio to: {temp_path}")
            
            # Use the original approach from cursor_test.py
            r = sr.Recognizer()
            with sr.AudioFile(temp_path) as source:
                print("Listening...")
                r.adjust_for_ambient_noise(source)
                audio = r.record(source)
                
                print("Recognizing...")
                text = r.recognize_google(audio)
                print(f"User: {text}")
                
                # Get response from Gemini
                response = get_gemini_response(text)
                
                # Return both the transcribed text and the response
                return jsonify({
                    'transcribed': text,
                    'response': response
                })
                
        except sr.UnknownValueError:
            print("Can't get that, repeat once")
            return jsonify({'error': 'Could not recognize speech, please try again'}), 400
        except sr.RequestError as e:
            print(f"Could not request results from Google Speech Recognition service: {e}")
            return jsonify({'error': 'Speech service error'}), 500
        except Exception as e:
            print(f"Error processing voice: {e}")
            return jsonify({'error': 'Processing error'}), 500
        finally:
            # Clean up the temporary file
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except:
                    pass
    
    except Exception as e:
        print(f"Error in voice endpoint: {e}")
        return jsonify({'error': 'Server error processing voice input'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 