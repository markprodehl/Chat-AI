import { useState } from 'react'

// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
// Provided the chatscope styling template to out components
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';

// The APY_KEY will allow us to make calls to OpenAI from our personal account
const API_KEY = "YOUR_API_KEY"

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
    // Process the message to chatgpt (send it over the response) with all the messages from our chat
    await processMessageToChatGPT(newMessages);
  }

  async function processMessageToChatGPT(chatMessages) {
    // chatMessages looks like this { sender: "user" or "ChatGPT", message: "The message content here"}
    // To send messages to the API we need to make a new API Array, which needs to be in this format for the frontend { role: "user", or "assistant", content: "The message content here" }
    // To format the API data we can build a new array by mapping through the all of the chatMessages and create a new object
    let apiMessages = chatMessages.map((messageObject) => {
      // Define role as an empty string
      let role = "";
      if(messageObject.sender === "ChatGPT") {
        role = "assistant"
      } else {
        role = "user"
      }
      return { role: role, content: messageObject.message}
    });

    // role: "user" -> message from the user
    // role "assistant" -> message from ChatGPT
    // role "system" -> one message defining how we want ChatGPT to talk. This is a really cool customization that most won't have access to
    const systemMessage = {
      role: "system",
      content: "Explain all concepts like I am 10 years old." // You can also add things like "Speak like a pirate", or "Explain like I am a software engineer with 10 years of experience"
    }

    const apiRequestBody = {
      "model" : "gpt-3.5-turbo",
      "messages" : [
        systemMessage, // Putting this at the front of the messages is require within the messages array to get processed
        ...apiMessages // [message1, message2, message3]
      ]
    }

    await fetch("https://api.openai.com/v1/chat/completions", {
      method: "post",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequestBody)
      // Now we need to grab the data being returned from OpenAI
    }).then((data) => {
      // Return the data as a JSON object
      return data.json();
      // Another .then to allow us to grab the new JSOn data
    }).then((data) => {
      // Log to show the structure of the response in the console
      console.log(data.choices[0].message.content)
      // Now we need to show this message to our user in the UI using the setMessages function
      setMessages(
        [
          ...chatMessages, {
          message: data.choices[0].message.content,
          sender: "ChatGPT"
          }
        ]
      );
      // Once we get the response we need to setTyping to false again
      setTyping(false);
    })
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
