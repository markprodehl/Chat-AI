import { useState, useRef, useEffect } from 'react';
import './styles.css';
import 'font-awesome/css/font-awesome.min.css';

import personalityOptions from './components/PersonalityOptions';
import processMessageToChatGPT from './components/ProcessMessageToChatGPT';
import ConversationList from './components/ConversationList';
import { signIn, signOut } from './components/authentication';

import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from './config/firebaseConfig';

function ChatAI() {
  const VITE_MY_OPENAI_API_KEY = import.meta.env.VITE_MY_OPENAI_API_KEY;

  const [typing, setTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [systemMessageText, setSystemMessageText] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [messages, setMessages] = useState([
    {
      message: 'Hello, I am your AI assistant. Feel free to ask me anything.',
      sender: 'ChatGpt',
      direction: 'incoming',
    },
  ]); // []
  const [conversationId, setConversationId] = useState(null);
  const messageListRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    const user = await signIn();
    setUser(user);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  useEffect(() => {
    const fetchConversation = async (conversationId) => {
      if (!conversationId) {
        console.error("Error: conversationId is undefined.");
        return;
      }
      
      try {
        const docRef = doc(db, 'conversations', conversationId);
        const docSnap = await getDoc(docRef);
    
        if (docSnap.exists()) {
          const docData = docSnap.data();
          if (docData && docData.messages) {
            setMessages(
              docData.messages.map((messagePair) => [
                { sender: 'user', message: messagePair.userMessage, direction: 'outgoing' },
                { sender: 'ChatGPT', message: messagePair.aiResponse, direction: 'incoming' },
              ]).flat()
            );
          } else {
            console.log("No messages found in the conversation.");
          }
        } else {
          console.log("No such document!");
        }
      } catch (e) {
        console.error("Error fetching conversation: ", e);
      }
    };
  
    if (conversationId) {
      fetchConversation(conversationId);
    }
  }, [conversationId]);
  

  useEffect(() => {
    const createNewConversation = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // console.log("USER", user)
          const userId = user.uid;
          const userRef = doc(db, 'users', userId); // Get the document reference to the current user
          const newConversationRef = await addDoc(collection(userRef, 'conversations'), {
            createdAt: serverTimestamp(),
          });
          setConversationId(newConversationRef.id);
        }
      } catch (e) {
        console.error('Error creating new conversation: ', e);
      }
    };
  
    // TODO - Save systemMessageText to the db rather than localStorage
    if (!initialized) {
      const storedSystemMessageText = localStorage.getItem("systemMessageText");
      setSystemMessageText(
        storedSystemMessageText || "Explain all concepts like I am 10 years old."
      );
      setInitialized(true);
      // Need this timeout to allow setSystemMessageText execute. POTENTIAL ISSUES WITH THIS
      setTimeout(() => {
        createNewConversation();
      }, 1000); // Set timeout here, adjust the time as needed
    } else {
      localStorage.setItem("systemMessageText", systemMessageText);
    }
  }, [initialized, systemMessageText]);  

  const handleSend = async (message) => {
    const newMessage = {
      message: message,
      sender: 'user',
      direction: 'outgoing'
    };

    const newMessages = [...messages, newMessage] // By adding all of the messages and the newMessage this will allow ChatGPT to keep context of teh conversation
    // Update the message state
    setMessages(newMessages);
    // Set a typing indicator (chatgpt is typing)
    setTyping(true);
    // Process the message to chatgpt (send it over the response) with all the messages from our chat so that the context of the conversation is maintained
    if (conversationId) { // Check if conversationId is defined before calling processMessageToChatGPT
      await processMessageToChatGPT(
        newMessages,
        VITE_MY_OPENAI_API_KEY,
        systemMessageText,
        setMessages,
        setTyping,
        setTypingText,
        conversationId
      );
    }
  };

  useEffect(() => {
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages]);

  const handleButtonClick = () => {
    const inputElement = document.querySelector('.message-input');
    handleSend(inputElement.value);
    inputElement.value = '';
  };

  return (
    <div className="chat-ai">
      {user ? (
        <button onClick={handleSignOut}>Sign Out</button>
      ) : (
        <button onClick={handleSignIn}>Sign In with Google</button>
      )}
      <ConversationList setConversationId={setConversationId} setMessages={setMessages} />
      <div className="chat-container" style={{ overflowY: 'scroll' }} ref={messageListRef}>
        <div className="message-list-container">
          <div className="message-list">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`message ${
                  message.direction === 'incoming'
                    ? 'message-incoming'
                    : 'message-outgoing'
                }`}
              >
                {message.message}
              </div>
            ))}
            {typing && (
              <div className="message message-incoming typing-indicator typing-animation">
                AI processing: <span>{typingText}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="message-input-container">
        <input
          className="message-input"
          type="text"
          placeholder="Type message here"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSend(e.target.value);
              e.target.value = '';
            }
          }}
        />
        <button
          className="send-button"
          onClick={handleButtonClick}
        >
          <i className="fa fa-paper-plane" aria-hidden="true"></i>
        </button>
      </div>
      <div className="system-message-container">
        <label htmlFor="system-message-input">Personality: </label>
        <select
          id="system-message-selection"
          value={systemMessageText}
          onChange={(e) => setSystemMessageText(e.target.value)}
        >
          {personalityOptions.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
  
}

export default ChatAI
