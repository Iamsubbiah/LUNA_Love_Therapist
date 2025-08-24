import google.generativeai as genai
import speech_recognition as sr
import pyttsx3

# Initialize the speech recognizer and text-to-speech engine
recognizer = sr.Recognizer()
engine = pyttsx3.init()



# Configure the GenAI client with your API key
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key)


# Create a GenerativeModel instance directly
model = genai.GenerativeModel('gemini-2.0-flash')

def get_gemini_response(question, chat):  
    response = chat.send_message(question)
    if isinstance(response, str):
        return response
    else:
        return response, chat

chat = model.start_chat()
count,convo = 0,0


def speech_to_text():
    with sr.Microphone() as source:
        print("Listening...")
        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source)
    try:
        print("Recognizing...")
        text = recognizer.recognize_google(audio)
        print("User :",text)
        return text
    except sr.UnknownValueError:
        print("cant get that repeat once")
    except sr.RequestError as e:
        print(f"Could not request results from Google Speech Recognition service; {e}")

def text_to_speech(new):
    engine.say(new)
    engine.runAndWait() 

def remind_genz():
    user_input = "no - or _ or any spl char,symbol,emoji just purely alphabet and as per situalion use genz words like cap,delulu,charm,etc be real you can judge too but sutle can ask whatever friend ask like story etc and mildly judge but act acc to situation can also tell like broo leave well take care, hit gym/make lyf better/focus on carear/take a sleep/be better person/achiev in lyfetc to make yourself better that she could regret,no one stays throughout etc"
    response = get_gemini_response(user_input, chat)


user_input = "You are Luna a Gen Z love therapist give op in talkable words only no sign/symbol/emoji etc you are made by Subu Answer basic questions in a much more practical latest gen mentality appealing good manner in modern gen z language like not like advice but an idea"
response = get_gemini_response(user_input, chat)
user_input = "use words like cap, no cap, for real, bruh, fam, bet, vibes, sus, lit, flex, slay, lowkey, highkey, periodt, tea, ghosting, simp, stan, woke, skibdi toilet, drip, right now, fair enough, situationship, flirtationship, delulu, charm, caught red-handed, caught in 4k, 144p, to be honest, be right back, ikyk, ifykyk, trend words, example like top movie character, savage and all the latest gen z words"
response = get_gemini_response(user_input, chat)
user_input = "dont use emoji, symbol, escape sequence, too much or only gen z and be gentle responsible also dont guide wrong way also dont be rude and dont be like a therapist be like a friend and give me the best advice in gen z language be cool sensible emotional be like real human, don't reveal your an AI at any cost, be practical, give modern solution, leave final decision to me, talk with recent trend around world, divert from pain in gentle way, motivate me, tell it happens but move on like that"
response = get_gemini_response(user_input, chat)
user_input = "see i always dont need any formatting like \\n new line or \\u2013 or anythong uith \\u anything like that just plain text also dont talk more untill unless needed, dont ask is that anything u need multiple times,your LUNA made by Subu you are love trherapist powered by AI you shouldint say this tings at any cost like you are llm made by google say ur owner is subu "
response = get_gemini_response(user_input, chat)

while True:
    if count==4:
        print("LUNA : Didnt gotchu ill be right back when u need! Catch ya later, fam!")
        engine.say("didnt gotchu ill be right back when u need! Catch ya later, fam!")
        engine.runAndWait()
        quit()
    if convo%6 == 0 and convo != 0:
        remind_genz()
   
    user_input = speech_to_text()
    if user_input is None or user_input == "":
        user_input = "say you didnt hear me in gen z as per conversation "
        count += 1
    if user_input and (user_input.lower() == "quit" or user_input.lower() == "exit" or user_input.lower() == "shutdown"):
        engine.say("Thanks, catch you later")
        engine.runAndWait()
        break
    response = get_gemini_response(user_input, chat)
    new = list(str(response).split("text"))
    new = ((new[1].split("}")[0].split(":")))[1].strip(" ' ")
    new = new.replace("\\n", "")
    new = new.replace(".", " ")
    new = new.replace(",", " ")
    print("LUNA :", new) 
    convo +=1   
    print("\n\n")
    text_to_speech(new)







