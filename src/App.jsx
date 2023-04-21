import { useState } from 'react'

// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
// Provided the chatscope styling template to out components
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';

function App() {
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      message: "Hello, I am ChatGPT",
      sender: "ChatGpt"
    }
  ]) //[]
  
  const handleSend = async (message) => {
    const newMessage = {
      message: message,
      sender: "user",
      direction: "outgoing"
    }

    const newMessages = [...messages, newMessage ] // All of thge old messages plus the new message
  
    // Update the message state
    setMessages(newMessages);
  
    // Set a typing indicator (chatgpt is typing)
    setTyping(true);

    // process the message to chatgpt (send it over the response)
  }


  return (
   <div className="App">
      <div style={{ position: "relative", height: "800px", width: "700px"}}>
        <MainContainer>
          <ChatContainer>
            <MessageList
              // If yping is set to true display the TypingIndicator element, otherwise null
              typingIndicator={typing ? <TypingIndicator content="ChatGPT is typing"/> : null}
            >
              {messages.map((message, i) => {
                return <Message key={i} model={message} />
              })}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={handleSend} />

          </ChatContainer>
        </MainContainer>

      </div>

   </div>
  )
}

export default App
