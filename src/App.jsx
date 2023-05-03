import { useState, useRef, useEffect } from 'react';
import './styles.css';
import 'font-awesome/css/font-awesome.min.css';

import personalityOptions from './components/PersonalityOptions';
import processMessageToChatGPT from './components/ProcessMessageToChatGPT';

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

  const messageListRef = useRef(null);

  useEffect(() => {
    if (!initialized) {
      const storedSystemMessageText = localStorage.getItem("systemMessageText");
      setSystemMessageText(
        storedSystemMessageText || "Explain all concepts like I am 10 years old."
      );
      setInitialized(true);
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
    await processMessageToChatGPT(newMessages, VITE_MY_OPENAI_API_KEY, systemMessageText, setMessages, setTyping, setTypingText);
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
