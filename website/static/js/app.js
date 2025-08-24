document.addEventListener('DOMContentLoaded', () => {
    // Initialize app
    const app = {
        // Input/Output modes
        isVoiceInput: false,
        isVoiceOutput: false,
        
        // Voice recording
        isRecording: false,
        mediaRecorder: null,
        audioChunks: [],
        
        // Conversation stats
        conversationCount: 0,
        
        // DOM Elements
        cursorFollower: document.querySelector('.cursor-follower'),
        messageInput: document.getElementById('message-input'),
        sendButton: document.getElementById('send-button'),
        recordButton: document.getElementById('record-button'),
        chatMessages: document.getElementById('chat-messages'),
        textInputContainer: document.querySelector('.text-input-container'),
        voiceInputContainer: document.querySelector('.voice-input-container'),
        
        // Input toggle buttons
        toggleTextInputButton: document.getElementById('toggle-text-input'),
        toggleVoiceInputButton: document.getElementById('toggle-voice-input'),
        
        // Output toggle buttons
        toggleTextOutputButton: document.getElementById('toggle-text-output'),
        toggleVoiceOutputButton: document.getElementById('toggle-voice-output'),
        
        // Theme toggle
        themeToggle: document.getElementById('theme-toggle'),
        
        // Conversation stats
        conversationCountElement: document.getElementById('conversation-count'),
        
        init() {
            this.initCursorEffect();
            this.initEventListeners();
            this.checkDarkModePreference();
            
            // Hide loader after a brief timeout (in case the 3D scene loads quickly)
            setTimeout(() => {
                document.querySelector('.loader-container').classList.add('hidden');
            }, 3000);
        },
        
        initCursorEffect() {
            // Custom cursor follower effect
            document.addEventListener('mousemove', (e) => {
                // Smooth follow with slight delay using GSAP if available, otherwise use basic transition
                if (typeof gsap !== 'undefined') {
                    gsap.to(this.cursorFollower, {
                        x: e.clientX,
                        y: e.clientY,
                        duration: 0.3
                    });
                } else {
                    this.cursorFollower.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
                }
            });
            
            // Make cursor larger when hovering over interactive elements
            const interactiveElements = document.querySelectorAll('button, textarea, .message');
            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    this.cursorFollower.style.width = '40px';
                    this.cursorFollower.style.height = '40px';
                });
                
                el.addEventListener('mouseleave', () => {
                    this.cursorFollower.style.width = '24px';
                    this.cursorFollower.style.height = '24px';
                });
            });
        },
        
        initEventListeners() {
            // Input toggle buttons
            this.toggleTextInputButton.addEventListener('click', () => this.setInputMode('text'));
            this.toggleVoiceInputButton.addEventListener('click', () => this.setInputMode('voice'));
            
            // Output toggle buttons
            this.toggleTextOutputButton.addEventListener('click', () => this.setOutputMode('text'));
            this.toggleVoiceOutputButton.addEventListener('click', () => this.setOutputMode('voice'));
            
            // Text input submission
            this.sendButton.addEventListener('click', () => this.sendMessage());
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Voice recording
            this.recordButton.addEventListener('click', () => this.toggleRecording());
            
            // Auto-resize textarea
            this.messageInput.addEventListener('input', () => {
                this.messageInput.style.height = 'auto';
                this.messageInput.style.height = (this.messageInput.scrollHeight < 120) 
                    ? `${this.messageInput.scrollHeight}px` : '120px';
            });
        },
        
        checkDarkModePreference() {
            // Check system preference for dark mode
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.themeToggle.checked = true;
                document.body.classList.add('dark-theme');
            }
        },
        
        setInputMode(mode) {
            if (mode === 'text') {
                this.isVoiceInput = false;
                this.textInputContainer.classList.remove('hidden');
                this.voiceInputContainer.classList.add('hidden');
                this.toggleTextInputButton.classList.add('active');
                this.toggleVoiceInputButton.classList.remove('active');
                
                // Stop recording if it's active
                if (this.isRecording && this.mediaRecorder) {
                    this.mediaRecorder.stop();
                    this.isRecording = false;
                }
            } else {
                this.isVoiceInput = true;
                this.textInputContainer.classList.add('hidden');
                this.voiceInputContainer.classList.remove('hidden');
                this.toggleTextInputButton.classList.remove('active');
                this.toggleVoiceInputButton.classList.add('active');
                
                // Request microphone permission
                this.setupMicrophone();
            }
        },
        
        setOutputMode(mode) {
            if (mode === 'text') {
                this.isVoiceOutput = false;
                this.toggleTextOutputButton.classList.add('active');
                this.toggleVoiceOutputButton.classList.remove('active');
                
                // Stop any ongoing speech
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
            } else {
                this.isVoiceOutput = true;
                this.toggleTextOutputButton.classList.remove('active');
                this.toggleVoiceOutputButton.classList.add('active');
                
                // Test speech synthesis
                if ('speechSynthesis' in window) {
                    // Check if the browser supports speech synthesis
                    console.log('Speech synthesis supported');
                } else {
                    alert('Your browser does not support speech synthesis. Please try another browser or use text output mode.');
                    this.setOutputMode('text');
                }
            }
        },
        
        setupMicrophone() {
            // Check if Web Speech API is supported
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                console.log('Web Speech API supported!');
                
                // Create speech recognition object
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                
                // Configure recognition
                this.recognition.continuous = false;
                this.recognition.interimResults = false;
                this.recognition.lang = 'en-US';
                
                // Handle results
                this.recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    console.log('Recognized text:', transcript);
                    
                    // Add user message
                    const messageDiv = this.addMessageToChat('user', transcript);
                    
                    // Send to backend
                    this.sendTextToBackend(transcript);
                };
                
                // Handle errors
                this.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    this.recordButton.classList.remove('recording');
                    this.recordButton.querySelector('span').textContent = 'Tap to Speak';
                    
                    if (event.error === 'no-speech') {
                        alert('No speech was detected. Please try again.');
                    } else if (event.error === 'not-allowed') {
                        alert('Microphone access denied. Please allow microphone access.');
                        this.setInputMode('text');
                    }
                };
                
                // Handle end of recognition
                this.recognition.onend = () => {
                    console.log('Speech recognition ended');
                    this.recordButton.classList.remove('recording');
                    this.recordButton.querySelector('span').textContent = 'Tap to Speak';
                    this.isRecording = false;
                };
                
                // Success visual feedback
                this.recordButton.style.backgroundColor = '#7b5bff';
                setTimeout(() => {
                    this.recordButton.style.backgroundColor = '';
                }, 500);
                
                console.log('Web Speech API setup complete');
            } else {
                console.error('Web Speech API not supported');
                alert('Your browser does not support voice input. Please try using Chrome or Edge, or use text input instead.');
                this.setInputMode('text');
            }
        },
        
        startRecording() {
            if (this.recognition) {
                try {
                    // Update UI
                    this.recordButton.classList.add('recording');
                    this.recordButton.querySelector('span').textContent = 'Listening...';
                    this.isRecording = true;
                    
                    // Start recognition
                    this.recognition.start();
                    console.log('Speech recognition started');
                    
                    // Auto-stop after 10 seconds
                    this.recordingTimeout = setTimeout(() => {
                        if (this.isRecording) {
                            this.stopRecording();
                        }
                    }, 10000);
                } catch (error) {
                    console.error('Error starting speech recognition:', error);
                    this.recordButton.classList.remove('recording');
                    this.recordButton.querySelector('span').textContent = 'Tap to Speak';
                }
            } else {
                console.warn('Speech recognition not initialized');
                this.setupMicrophone();
            }
        },
        
        stopRecording() {
            if (this.recognition && this.isRecording) {
                try {
                    // Stop recognition
                    this.recognition.stop();
                    console.log('Speech recognition stopped by user');
                } catch (error) {
                    console.error('Error stopping speech recognition:', error);
                }
            }
            
            // Clear timeout if set
            if (this.recordingTimeout) {
                clearTimeout(this.recordingTimeout);
                this.recordingTimeout = null;
            }
            
            // Reset UI
            this.recordButton.classList.remove('recording');
            this.recordButton.querySelector('span').textContent = 'Tap to Speak';
            this.isRecording = false;
        },
        
        sendTextToBackend(text) {
            if (!text) return;
            
            console.log('Sending text to backend:', text);
            
            fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'text',
                    message: text
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Server error: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                // Add Luna's response
                this.addMessageToChat('luna', data.response);
                console.log('LUNA:', data.response);
                
                // Update conversation count
                this.updateConversationCount();
                
                // Speak response if voice output is enabled
                this.speakResponse(data.response);
                
                // Auto-reactivate microphone if in voice input mode
                if (this.isVoiceInput && !this.isRecording) {
                    setTimeout(() => {
                        // Start recording again after a brief pause
                        this.startRecording();
                    }, 1000); // Short delay to allow for natural conversation flow
                }
            })
            .catch(error => {
                console.error('Error getting response:', error);
                this.addMessageToChat('luna', 'Sorry fam, something went wrong with my brain. Try again?');
            });
        },
        
        sendMessage() {
            const message = this.messageInput.value.trim();
            if (!message) return;
            
            // Add user message to chat
            this.addMessageToChat('user', message);
            
            // Clear input
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
            
            // Send to backend
            this.sendToBackend('text', message);
        },
        
        async sendVoiceMessage(audioBlob) {
            // Show user message with listening status
            const loadingMessage = this.addMessageToChat('user', '🎤 Listening...');
            
            try {
                console.log('Processing audio...');
                
                // Create form data to send audio
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.wav');
                
                // Update to show recognizing status
                loadingMessage.querySelector('p').textContent = '🎤 Recognizing...';
                
                // Send to the server
                const response = await fetch('/api/chat/voice', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Update the user message to show what was recognized
                if (data.transcribed) {
                    loadingMessage.querySelector('p').textContent = data.transcribed;
                    console.log(`User: ${data.transcribed}`);
                } else {
                    loadingMessage.querySelector('p').textContent = '(Voice not recognized)';
                }
                
                // Show Luna's response
                this.addMessageToChat('luna', data.response);
                console.log(`LUNA: ${data.response}`);
                
                // Update conversation count
                this.updateConversationCount();
                
                // Speak response if voice output is enabled
                this.speakResponse(data.response);
                
            } catch (error) {
                console.error('Error processing voice:', error);
                loadingMessage.querySelector('p').textContent = 'Voice not recognized. Try again?';
                this.addMessageToChat('luna', 'I couldn\'t catch that. Mind trying again?');
            }
        },
        
        handleVoiceResponse(data, loadingMessage) {
            // Replace loading message with transcribed text
            if (data.transcribed) {
                loadingMessage.querySelector('p').textContent = data.transcribed;
            } else {
                loadingMessage.querySelector('p').textContent = '(Voice message)';
            }
            
            // Add Luna's response
            this.addMessageToChat('luna', data.response);
            
            // Update conversation count
            this.updateConversationCount();
            
            // Speak response if voice output is enabled
            this.speakResponse(data.response);
        },
        
        addMessageToChat(sender, content) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            messageDiv.classList.add(sender === 'user' ? 'user-message' : 'luna-message');
            
            const avatarContainer = document.createElement('div');
            avatarContainer.classList.add('avatar-container');
            
            const avatar = document.createElement('div');
            avatar.classList.add('avatar');
            avatarContainer.appendChild(avatar);
            
            const messageContent = document.createElement('div');
            messageContent.classList.add('message-content');
            
            const paragraph = document.createElement('p');
            paragraph.textContent = content;
            messageContent.appendChild(paragraph);
            
            messageDiv.appendChild(avatarContainer);
            messageDiv.appendChild(messageContent);
            
            this.chatMessages.appendChild(messageDiv);
            
            // Scroll to bottom
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            
            return messageDiv;
        },
        
        updateConversationCount() {
            this.conversationCount++;
            this.conversationCountElement.textContent = `Conversations: ${this.conversationCount}`;
            
            // Update reminder logic (every 6th message)
            if (this.conversationCount % 6 === 0) {
                console.log('Reminder triggered at conversation count:', this.conversationCount);
                // We'll implement the remind_genz equivalent here
                this.sendToBackend('system', 'remind_genz');
            }
        },
        
        speakResponse(text) {
            if (!this.isVoiceOutput || !('speechSynthesis' in window)) return;
            
            // Stop any ongoing speech
            window.speechSynthesis.cancel();
            
            // Create a new speech instance
            const speech = new SpeechSynthesisUtterance(text);
            speech.rate = 1;
            speech.pitch = 1.1;
            speech.volume = 1;
            
            // Use a female voice if available
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => voice.name.includes('female') || voice.name.includes('Female'));
            if (femaleVoice) speech.voice = femaleVoice;
            
            // Speak the text
            window.speechSynthesis.speak(speech);
            
            console.log('Speaking response:', text);
        },
        
        async sendToBackend(type, message, audio = null) {
            try {
                console.log(`Sending ${type} message to backend:`, message || audio?.substring(0, 30) + '...');
                
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type,
                        message,
                        audio
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Update conversation count
                    if (type !== 'system') {
                        this.updateConversationCount();
                    }
                    
                    // If this was a voice message, replace the loading message and add the transcribed text
                    if (type === 'audio') {
                        const lastMessage = this.chatMessages.lastChild;
                        if (lastMessage) this.chatMessages.removeChild(lastMessage);
                        
                        if (data.transcribed) {
                            // Add the transcribed text
                            this.addMessageToChat('user', data.transcribed);
                        } else {
                            // Fallback if no transcription
                            this.addMessageToChat('user', 'Voice message');
                        }
                    }
                    
                    // Add Luna's response
                    this.addMessageToChat('luna', data.response);
                    
                    // Speak response if voice output is enabled
                    this.speakResponse(data.response);
                } else {
                    console.error('Error from server:', data.error);
                    
                    // Handle errors nicely
                    if (type === 'audio') {
                        const lastMessage = this.chatMessages.lastChild;
                        if (lastMessage) this.chatMessages.removeChild(lastMessage);
                        this.addMessageToChat('user', 'Could not process voice message');
                    }
                    
                    this.addMessageToChat('luna', 'Sorry fam, I\'m having a moment. Could you try again?');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                
                if (type === 'audio') {
                    const lastMessage = this.chatMessages.lastChild;
                    if (lastMessage) this.chatMessages.removeChild(lastMessage);
                }
                
                this.addMessageToChat('luna', 'Oof, connection issues. Check your internet and try again, k?');
            }
        },
        
        toggleRecording() {
            if (!this.recognition) {
                this.setupMicrophone();
                // Wait a bit for setup to complete before trying to start
                setTimeout(() => {
                    if (this.recognition) {
                        this.startRecording();
                    }
                }, 500);
                return;
            }
            
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        }
    };
    
    // Initialize app
    app.init();
    
    // Voice synthesis initialization - load voices when available
    if ('speechSynthesis' in window) {
        // Chrome needs this to get voices
        window.speechSynthesis.onvoiceschanged = () => {
            console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
        };
        
        // Force loading voices
        window.speechSynthesis.getVoices();
    }
    
    // Add tilt effects to messages on hover using vanilla JS
    const addTiltEffect = () => {
        document.querySelectorAll('.message-content').forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const xPercent = (x / rect.width - 0.5) * 20;
                const yPercent = (y / rect.height - 0.5) * 20;
                
                element.style.transform = `perspective(500px) rotateX(${-yPercent}deg) rotateY(${xPercent}deg) scale3d(1.05, 1.05, 1.05)`;
                element.style.boxShadow = `0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07)`;
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'perspective(500px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                element.style.boxShadow = 'none';
            });
        });
    };
    
    // Add tilt effect to existing messages and set up a mutation observer to add it to new messages
    addTiltEffect();
    const observer = new MutationObserver(addTiltEffect);
    observer.observe(app.chatMessages, { childList: true });
}); 