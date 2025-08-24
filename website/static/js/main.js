document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const recordBtn = document.getElementById('record-btn');
    const toggleAutoMic = document.getElementById('toggle-auto-mic');
    const toggleVoiceOutput = document.getElementById('toggle-voice-output');
    const toggleModeBtn = document.getElementById('toggle-mode');
    const loader = document.getElementById('loader');
    
    // Initialize custom cursor
    initCustomCursor();
    
    // State
    let isRecording = false;
    let autoMicEnabled = false;
    let voiceOutputEnabled = false;
    let recognition = null;
    let darkMode = true;
    let conversationCount = 0;
    
    // Initialize Vanilla Tilt for 3D effect
    initTiltEffect();
    
    // Initialize particles background
    initParticles();
    
    // Initialize speech recognition if supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            sendMessage();
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            stopRecording();
            showNotification('Error with voice input. Try again or use text input.');
        };
        
        recognition.onend = () => {
            stopRecording();
        };
    } else {
        toggleAutoMic.disabled = true;
        toggleAutoMic.title = 'Speech recognition not supported in this browser';
        recordBtn.style.display = 'none';
    }
    
    // Initialize speech synthesis
    const synthesis = window.speechSynthesis;
    if (!synthesis) {
        toggleVoiceOutput.disabled = true;
        toggleVoiceOutput.title = 'Speech synthesis not supported in this browser';
    }
    
    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    recordBtn.addEventListener('click', toggleRecording);
    
    // Auto-mic toggle
    toggleAutoMic.addEventListener('click', () => {
        autoMicEnabled = !autoMicEnabled;
        toggleAutoMic.classList.toggle('active', autoMicEnabled);
        localStorage.setItem('autoMicEnabled', autoMicEnabled.toString());
        
        if (autoMicEnabled) {
            showNotification('Auto-mic mode enabled - Luna will listen after speaking');
        } else {
            showNotification('Auto-mic mode disabled');
            stopRecording();
        }
    });
    
    // Load auto-mic setting from localStorage
    if (localStorage.getItem('autoMicEnabled') === 'true') {
        autoMicEnabled = true;
        toggleAutoMic.classList.add('active');
    }
    
    toggleVoiceOutput.addEventListener('click', () => {
        voiceOutputEnabled = !voiceOutputEnabled;
        toggleVoiceOutput.classList.toggle('active', voiceOutputEnabled);
        localStorage.setItem('voiceOutputEnabled', voiceOutputEnabled.toString());
        showNotification(voiceOutputEnabled ? 'Voice output enabled' : 'Voice output disabled');
        
        if (!voiceOutputEnabled) {
            synthesis.cancel();
        }
    });
    
    // Load voice output setting from localStorage
    if (localStorage.getItem('voiceOutputEnabled') === 'true') {
        voiceOutputEnabled = true;
        toggleVoiceOutput.classList.add('active');
    }
    
    toggleModeBtn.addEventListener('click', () => {
        darkMode = !darkMode;
        document.body.classList.toggle('light-theme', !darkMode);
        toggleModeBtn.innerHTML = darkMode ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        
        // Dispatch theme change event
        document.dispatchEvent(new CustomEvent('themeChange', {
            detail: { isLight: !darkMode }
        }));
        
        // Reinitialize tilt with new theme
        initTiltEffect();
        
        // Update particles colors
        updateParticlesTheme(!darkMode);
    });
    
    // Functions
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // Stop recording if active
        if (isRecording) {
            stopRecording();
        }
        
        addMessage(message, 'user');
        userInput.value = '';
        
        // Show loader
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'message luna-message loading';
        loadingMessage.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        chatContainer.appendChild(loadingMessage);
        scrollToBottom();
        
        // Add ripple effect to send button
        createRippleEffect(sendBtn);
        
        // Send to API
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        })
        .then(response => response.json())
        .then(data => {
            // Remove loading indicator
            chatContainer.removeChild(loadingMessage);
            
            // Add Luna's response
            addMessage(data.response, 'luna');
            conversationCount++;
            
            // Speak response if enabled
            if (voiceOutputEnabled) {
                speakText(data.response);
            } else if (autoMicEnabled) {
                // If voice output is disabled but auto-mic is enabled,
                // start listening immediately after Luna's response
                setTimeout(() => {
                    startRecording();
                }, 500);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            chatContainer.removeChild(loadingMessage);
            addMessage('Sorry, I encountered an error. Please try again.', 'luna');
        });
    }
    
    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.dataset.messageId = Date.now();
        
        // Create text paragraph
        const paragraph = document.createElement('p');
        
        // Format links in text
        const formattedText = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        paragraph.innerHTML = formattedText;
        
        // Add content to message
        messageElement.appendChild(paragraph);
        
        // Add voice indicator for Luna's messages
        if (sender === 'luna') {
            const voiceIndicator = document.createElement('div');
            voiceIndicator.className = 'voice-indicator';
            voiceIndicator.innerHTML = `
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
                <i class="fas fa-volume-up"></i>
            `;
            messageElement.appendChild(voiceIndicator);
            
            // Add audio visualizer
            const audioVisualizer = document.createElement('div');
            audioVisualizer.className = 'audio-visualizer';
            
            // Create audio bars
            for (let i = 0; i < 12; i++) {
                const bar = document.createElement('div');
                bar.className = 'audio-bar';
                audioVisualizer.appendChild(bar);
            }
            
            messageElement.appendChild(audioVisualizer);
        }
        
        chatContainer.appendChild(messageElement);
        
        // Apply tilt effect to new message
        if (window.VanillaTilt) {
            VanillaTilt.init(messageElement, {
                max: 5,
                speed: 300,
                glare: true,
                "max-glare": 0.1,
                scale: 1.03
            });
        }
        
        scrollToBottom();
        return messageElement;
    }
    
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }
    
    function startRecording() {
        if (!recognition) return;
        
        isRecording = true;
        recordBtn.classList.add('recording');
        recordBtn.innerHTML = '<i class="fas fa-stop"></i>';
        
        // Create or update auto-mic indicator
        updateAutoMicIndicator(true);
        
        try {
            recognition.start();
        } catch (e) {
            console.error('Recognition error:', e);
        }
    }
    
    function stopRecording() {
        if (!recognition) return;
        
        isRecording = false;
        recordBtn.classList.remove('recording');
        recordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        
        // Hide auto-mic indicator
        updateAutoMicIndicator(false);
        
        try {
            recognition.stop();
        } catch (e) {
            console.error('Recognition error:', e);
        }
    }
    
    function updateAutoMicIndicator(isVisible) {
        // Get or create the indicator
        let indicator = document.querySelector('.auto-mic-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'auto-mic-indicator';
            indicator.textContent = 'Listening...';
            document.querySelector('.chat-interface').appendChild(indicator);
        }
        
        // Show or hide based on state
        if (isVisible && autoMicEnabled) {
            indicator.classList.add('visible');
        } else {
            indicator.classList.remove('visible');
        }
    }
    
    function speakText(text) {
        if (!synthesis) return;
        
        // Cancel any ongoing speech
        synthesis.cancel();
        
        // Reset all speaking indicators
        document.querySelectorAll('.luna-message').forEach(el => {
            el.classList.remove('speaking');
            const indicator = el.querySelector('.voice-indicator');
            if (indicator) indicator.classList.remove('active');
        });
        
        // Find the most recent Luna message and add speaking class
        const lunaMessages = document.querySelectorAll('.luna-message');
        if (lunaMessages.length > 0) {
            const lastMessage = lunaMessages[lunaMessages.length - 1];
            lastMessage.classList.add('speaking');
            
            // Show voice indicator
            const indicator = lastMessage.querySelector('.voice-indicator');
            if (indicator) indicator.classList.add('active');
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Get available voices
        let voices = synthesis.getVoices();
        
        // If voices array is empty, wait for voices to load
        if (voices.length === 0) {
            synthesis.onvoiceschanged = () => {
                voices = synthesis.getVoices();
                setVoiceAndSpeak();
            };
        } else {
            setVoiceAndSpeak();
        }
        
        function setVoiceAndSpeak() {
            // Force waiting for voices to load completely
            voices = synthesis.getVoices();
            console.log("Available voices:", voices.map(v => v.name).join(", "));
            
            // Expanded priority list of female voices by platform
            // Higher quality, more natural female voices across different systems
            const femalePriority = [
                // Microsoft voices (Windows)
                "Microsoft Zira Desktop",
                "Microsoft Susan",
                "Microsoft Linda",
                "Microsoft Zira",
                
                // Google voices
                "Google UK English Female",
                "Google US English Female",
                
                // Apple voices (macOS/iOS)
                "Samantha",
                "Victoria",
                "Karen",
                "Moira",
                "Tessa",
                
                // Samsung voices
                "Karina",
                "Lisa",
                
                // Amazon voices
                "Joanna",
                "Kendra",
                "Kimberly",
                "Salli",
                
                // Other common female voices
                "Female",
                "woman",
                "Amy",
                "Ava",
                "Catherine",
                "Elizabeth",
                "Ellen",
                "Fiona"
            ];
            
            // First try: exact name match with our priority list
            let selectedVoice = null;
            for (const voiceName of femalePriority) {
                const foundVoice = voices.find(v => 
                    v.name === voiceName || 
                    v.name.includes(voiceName)
                );
                if (foundVoice) {
                    selectedVoice = foundVoice;
                    console.log("Found priority voice:", foundVoice.name);
                    break;
                }
            }
            
            // Second try: check for female indicators in voice name
            if (!selectedVoice) {
                const femaleIndicators = ['female', 'woman', 'girl', 'gal', 'lady', 'her', 'she'];
                
                for (const indicator of femaleIndicators) {
                    const foundVoice = voices.find(v => 
                        v.name.toLowerCase().includes(indicator) || 
                        (v.localService === true && v.name.match(/^[A-Z][a-z]+$/) && 
                         !v.name.match(/\b(David|Daniel|Diego|Guy|Jack|Josh|Justin|Paul|Thomas)\b/i))
                    );
                    
                    if (foundVoice) {
                        selectedVoice = foundVoice;
                        console.log("Found voice with female indicator:", foundVoice.name);
                        break;
                    }
                }
            }
            
            // Third try: check for common female names
            if (!selectedVoice) {
                const femaleNames = ['alice', 'amy', 'anna', 'beth', 'cath', 'ella', 'emma', 'hannah', 
                                   'jen', 'kate', 'kath', 'lisa', 'mary', 'nina', 'rose', 'sara', 
                                   'susan', 'tina', 'vick'];
                
                for (const name of femaleNames) {
                    const foundVoice = voices.find(v => 
                        v.name.toLowerCase().includes(name)
                    );
                    
                    if (foundVoice) {
                        selectedVoice = foundVoice;
                        console.log("Found voice with female name:", foundVoice.name);
                        break;
                    }
                }
            }
            
            // Fourth try: try to avoid obvious male voices
            if (!selectedVoice && voices.length > 0) {
                const maleNames = ['alex', 'bruce', 'chris', 'david', 'eric', 'fred', 'guy', 'jack', 
                                 'john', 'josh', 'male', 'man', 'mark', 'matt', 'mike', 'paul', 
                                 'peter', 'steve', 'tom'];
                
                // Find a voice that doesn't have male indicators
                const nonMaleVoice = voices.find(v => {
                    const lowerName = v.name.toLowerCase();
                    return !maleNames.some(name => lowerName.includes(name));
                });
                
                if (nonMaleVoice) {
                    selectedVoice = nonMaleVoice;
                    console.log("Found non-male voice:", nonMaleVoice.name);
                } else {
                    // Last resort - first voice
                    selectedVoice = voices[0];
                    console.log("Using default voice:", selectedVoice.name);
                }
            }
            
            // Set the voice if found
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                console.log("Selected voice:", selectedVoice.name);
            }
            
            // Fine-tune speech parameters for a smoother, more feminine sound
            utterance.rate = 0.9;        // Slightly slower for clarity
            utterance.pitch = 1.3;       // Higher pitch for more feminine sound
            utterance.volume = 1.0;      // Full volume
            
            // Process text to add natural pauses - using simple extra spacing
            // instead of SSML which isn't well supported
            const processedText = text
                .replace(/\./g, '.  ') 
                .replace(/\?/g, '?  ') 
                .replace(/\!/g, '!  ') 
                .replace(/,/g, ', ');
            
            utterance.text = processedText;
            
            // Events for monitoring speech progress
            utterance.onboundary = function(event) {
                // Handle word boundaries for visualization if needed
                console.log("Speech boundary at: " + event.charIndex);
            };
            
            utterance.onend = function() {
                // Remove speaking indicators when speech ends
                document.querySelectorAll('.luna-message').forEach(el => {
                    el.classList.remove('speaking');
                    const indicator = el.querySelector('.voice-indicator');
                    if (indicator) indicator.classList.remove('active');
                });
                
                // Auto-mic: Start listening when Luna finishes speaking
                if (autoMicEnabled) {
                    setTimeout(() => {
                        startRecording();
                    }, 500);
                }
            };
            
            // Start speaking
            synthesis.speak(utterance);
        }
    }
    
    function showNotification(message) {
        const notificationContainer = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notificationContainer.appendChild(notification);
        
        // Remove notification after animation completes
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 3100);
    }
    
    function initTiltEffect() {
        if (!window.VanillaTilt) return;
        
        // Apply tilt to all elements with data-tilt attribute
        VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
            max: 5,
            speed: 300,
            glare: true,
            "max-glare": 0.1,
            scale: 1.05
        });
        
        // Apply tilt to messages
        VanillaTilt.init(document.querySelectorAll(".message"), {
            max: 5,
            speed: 300,
            glare: true,
            "max-glare": 0.1,
            scale: 1.03
        });
    }
    
    function initCustomCursor() {
        // Create cursor elements
        const cursor = document.createElement('div');
        cursor.classList.add('custom-cursor');
        
        const cursorDot = document.createElement('div');
        cursorDot.classList.add('cursor-dot');
        
        // Add to DOM
        document.body.appendChild(cursor);
        document.body.appendChild(cursorDot);
        
        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
            
            cursorDot.style.left = `${e.clientX}px`;
            cursorDot.style.top = `${e.clientY}px`;
        });
        
        // Track clicks for click effect
        document.addEventListener('click', () => {
            cursor.classList.add('cursor-click');
            setTimeout(() => {
                cursor.classList.remove('cursor-click');
            }, 500);
        });
        
        // Add hover effect for interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .control-btn, .input-btn');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('cursor-hover');
                cursorDot.classList.add('cursor-hover');
            });
            
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('cursor-hover');
                cursorDot.classList.remove('cursor-hover');
            });
        });
    }
    
    function createRippleEffect(button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
        
        button.appendChild(ripple);
        
        // Remove ripple after animation completes
        setTimeout(() => {
            button.removeChild(ripple);
        }, 600);
    }
    
    function initParticles() {
        if (window.particlesJS) {
            particlesJS('particles-js', {
                "particles": {
                    "number": {
                        "value": 80,
                        "density": {
                            "enable": true,
                            "value_area": 800
                        }
                    },
                    "color": {
                        "value": darkMode ? "#ff45b5" : "#ff3db8"
                    },
                    "shape": {
                        "type": "circle",
                        "stroke": {
                            "width": 0,
                            "color": "#000000"
                        },
                        "polygon": {
                            "nb_sides": 5
                        }
                    },
                    "opacity": {
                        "value": 0.5,
                        "random": true,
                        "anim": {
                            "enable": true,
                            "speed": 1,
                            "opacity_min": 0.1,
                            "sync": false
                        }
                    },
                    "size": {
                        "value": 3,
                        "random": true,
                        "anim": {
                            "enable": true,
                            "speed": 2,
                            "size_min": 0.1,
                            "sync": false
                        }
                    },
                    "line_linked": {
                        "enable": true,
                        "distance": 150,
                        "color": darkMode ? "#7b5bff" : "#6a5aff",
                        "opacity": 0.4,
                        "width": 1
                    },
                    "move": {
                        "enable": true,
                        "speed": 1,
                        "direction": "none",
                        "random": true,
                        "straight": false,
                        "out_mode": "out",
                        "bounce": false,
                        "attract": {
                            "enable": true,
                            "rotateX": 600,
                            "rotateY": 1200
                        }
                    }
                },
                "interactivity": {
                    "detect_on": "canvas",
                    "events": {
                        "onhover": {
                            "enable": true,
                            "mode": "grab"
                        },
                        "onclick": {
                            "enable": true,
                            "mode": "push"
                        },
                        "resize": true
                    },
                    "modes": {
                        "grab": {
                            "distance": 140,
                            "line_linked": {
                                "opacity": 0.8
                            }
                        },
                        "bubble": {
                            "distance": 400,
                            "size": 40,
                            "duration": 2,
                            "opacity": 8,
                            "speed": 3
                        },
                        "repulse": {
                            "distance": 200,
                            "duration": 0.4
                        },
                        "push": {
                            "particles_nb": 4
                        },
                        "remove": {
                            "particles_nb": 2
                        }
                    }
                },
                "retina_detect": true
            });
        }
    }
    
    function updateParticlesTheme(isLight) {
        if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
            const particles = window.pJSDom[0].pJS.particles;
            
            // Update particle colors based on theme
            particles.color.value = isLight ? "#ff3db8" : "#ff45b5";
            particles.line_linked.color = isLight ? "#6a5aff" : "#7b5bff";
            
            // Refresh particles
            particles.array = [];
            window.pJSDom[0].pJS.fn.particlesRefresh();
        }
    }
    
    // Display initial message
    setTimeout(() => {
        // Hide loader
        loader.classList.add('hidden');
        
        // Add welcome message
        addMessage("Hey, I'm Luna 💜 — your no-judgment bro, I am always-here-for-you bro, you know what Bro means. Whatever you're feeling, I'm listening. You're not alone, I got you 🤍 opening up makes us realize its just a bad day not a bad life i am always there for you i repeat always.🫂💬", 'luna');
        
        // Add initial notification about auto-mic if enabled
        if (autoMicEnabled) {
            setTimeout(() => {
                showNotification('Auto-mic mode is enabled. Luna will listen after speaking.');
            }, 1000);
        }
    }, 2500);
}); 