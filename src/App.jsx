import { useState } from 'react'
import './App.css'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';

function ChatAI() {
  const VITE_MY_OPENAI_API_KEY = import.meta.env.VITE_MY_OPENAI_API_KEY

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

    const newMessages = [...messages, newMessage ] // By adding all of the messages and the newMessage this will allow ChatGPT to keep context of teh conversation
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
    // role "system" -> A message defining how we want ChatGPT to talk. This is a really cool customization that most won't have access to
    const systemMessage = {
      role: "system",
      content: "Explain all concepts like I am 10 years old." // You can also add things like "Speak like a pirate", or "Explain like I am a software engineer with 10 years of experience"
      // content: "Speak like philosopher." 
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
        "Authorization": "Bearer " + VITE_MY_OPENAI_API_KEY,
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
    <div className="chat-ai">
      <div className="chat-container">
        <div className="message-list-container">
          <MessageList
            className="message-list"
            scrollBehavior="smooth"
            typingIndicator={typing ? <TypingIndicator content="ChatGPT is typing" /> : null}
          >
            {messages.map((message, i) => {
              return <Message key={i} model={message} />;
            })}
          </MessageList>
        </div>
        <div className="message-input-container">
          <MessageInput className="message-input" placeholder="Type message here" onSend={handleSend} />
        </div>
      </div>
    </div>
  );
  
}

export default ChatAI
