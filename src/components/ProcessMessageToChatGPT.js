import { updateDoc, arrayUnion, doc, serverTimestamp } from 'firebase/firestore';
import db from '../config/firebaseConfig';


const processMessageToChatGPT = async (
    chatMessages,
    VITE_MY_OPENAI_API_KEY,
    systemMessageText,
    setMessages,
    setTyping,
    setTypingText, 
    conversationId
  ) => {
    // chatMessages looks like this { sender: "user" or "ChatGPT", message: "The message content here"}
    // To send messages to the API we need to make a new API Array, which needs to be in this format for the frontend { role: "user", or "assistant", content: "The message content here" }
    // To format the API data we can build a new array by mapping through the all of the chatMessages and create a new object
    let apiMessages = chatMessages.map((messageObject) => {
      // Initialize role as an empty string
      let role = '';
      if (messageObject.sender === 'ChatGPT') {
        role = 'assistant';
      } else {
        role = 'user';
      }
      return { role: role, content: messageObject.message };
    });
  
    // role: "user" -> message from the user
    // role "assistant" -> message from ChatGPT
    // role "system" -> A message defining how we want ChatGPT to respond to the user input
    const systemMessage = {
      role: 'system',
      content: systemMessageText,
    };
  
    const apiRequestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        systemMessage, // Putting this at the front of the messages is require within the messages array to get processed
        ...apiMessages, // [message1, message2, message3]
      ],
    };
    
    await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        Authorization: 'Bearer ' + VITE_MY_OPENAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestBody),
    })
      // Now we need to grab the data being returned from OpenAI
      .then((data) => {
        // Return the data as a JSON object
        return data.json();
      })

      // USe this if you dont want the typing effect
      // .then((data) => {
      //   // Log to show the structure of the response in the console
      // console.log(data.choices[0].message.content)
      //  // Now we need to show this message to our user in the UI using the setMessages function
      //   setMessages([
      //     ...chatMessages,
      //     {
      //       message: data.choices[0].message.content,
      //       sender: 'ChatGPT',
      //     },
      //   ]);
      //    // Once we get the response we need to setTyping to false again
      //   setTyping(false);
      // });

      // To add the TYPING EFFECT use this

      .then(async (data) => {
        // Log to show the structure of the response in the console
        console.log(data.choices[0].message.content); // Displays the response in the browser console
        // Show the typing text one character at a time
        let typingTimeout = 5; // You can adjust the typing speed by changing this value
        const responseText = data.choices[0].message.content; 
        responseText.split('').forEach((char, i) => {
          // After displaying the whole message, update the messages state and clear the typingText state
          setTimeout(() => {
            setTypingText((prevTypingText) => prevTypingText + char);
          }, typingTimeout * i);
        });
  
        setTimeout(async () => {
          setMessages([
            ...chatMessages,
            {
              message: responseText,
              sender: 'ChatGPT',
              direction: 'incoming',
            },
          ]);

          // Save the conversation history to Firestore
          const conversationRef = doc(db, 'conversations', conversationId);
          await updateDoc(conversationRef, {
            messages: arrayUnion({
              userMessage: chatMessages[chatMessages.length - 1].message,
              aiResponse: responseText,
            }),
            lastUpdated: serverTimestamp(),
          });

          setTypingText('');
          setTyping(false);
        }, typingTimeout * responseText.length);
      });
  };
  
  export default processMessageToChatGPT;
  
  