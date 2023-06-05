import React from 'react'
import { useState, useRef, useEffect } from 'react';
import './styles.css';
import 'font-awesome/css/font-awesome.min.css';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { twilight } from 'react-syntax-highlighter/dist/esm/styles/prism'; // choose the style you prefer
import 'react-syntax-highlighter/dist/esm/styles/prism/solarizedlight';

import processMessageToChatGPT from './components/ProcessMessageToChatGPT';
import ConversationList from './components/ConversationList';
import { signIn, signInWithEmail, signUpWithEmail, signOut } from './components/authentication';
import SignIn from './components/SignIn';

import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './config/firebaseConfig';

function ChatAI() {
  const VITE_MY_OPENAI_API_KEY = import.meta.env.VITE_MY_OPENAI_API_KEY;
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [systemMessageText, setSystemMessageText] = useState('');
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
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      
      if (user) {
        // Fetch the user's document from Firestore
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          // Get the data from the user's document
          const userData = docSnap.data();
          
          setUser(user);
          // Set systemMessageText from the user's document data
          setSystemMessageText(userData.systemMessageText);
        } else {
          console.log('No user document found!');
        }
      } else {
        setUser(null);
        setSystemMessageText("Explain all concepts like I am 10 years old."); // reset systemMessageText to default
      }
      setLoading(false); // Once the initial authentication state is determined, set loading to false
    });

    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, []);

  // Save systemMessageText to Firestore when it changes
  useEffect(() => {
    const saveSystemMessageText = async () => {
      if (user && systemMessageText !== user.systemMessageText) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            systemMessageText: systemMessageText,
          });
        } catch (error) {
          console.error('Error saving systemMessageText:', error);
        }
      }
    };

    saveSystemMessageText();
  }, [systemMessageText, user]);

  const handleSignIn = async () => {
    const user = await signIn();
    setUser(user);
  };

  const handleSignInWithEmail = async (email, password) => {
    const user = await signInWithEmail(email, password);
    setUser(user);
  };

  const handleSignUpWithEmail = async (email, password) => {
    const user = await signUpWithEmail(email, password);
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
        const user = auth.currentUser;
        if (user) {
          const userId = user.uid;
          const docRef = doc(db, 'users', userId );
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
        } else {
          console.error("Error: auth.currentUser is null.");
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
  
    if (user && systemMessageText) {
      createNewConversation();
    }
  }, [user, systemMessageText]);
 
  const handleSend = async (message) => {
    const newMessage = {
      message: message,
      sender: 'user',
      direction: 'outgoing'
    };

    const newMessages = [...messages, newMessage] // By adding all of the messages and the newMessage this will allow ChatGPT to keep context of teh conversation
    // Update the message state
    setMessages(newMessages);
    // Set a typing indicator (AI Processing)
    setTyping(true);
    // if(!systemMessageText) {
    //   console.log("In handlesend system message is undefined", systemMessageText)
    // }
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
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleButtonClick = () => {
    const inputElement = document.querySelector('.message-input');
    handleSend(inputElement.value);
    inputElement.value = '';
  };

  function formatLists(text) {
    // Split the input text into individual lines.
    const lines = text.split('\n');
  
    // Initialize an empty list to hold list items.
    let list = [];
  
    // Initialize an empty list to hold the formatted lines of text.
    let formattedLines = [];
  
    // This function processes the list items collected so far and appends the
    // corresponding HTML list to the formatted lines of text.
    const processList = () => {
      if (list.length > 0) {
        // Determine whether to use an unordered list (<ul>) or an ordered list (<ol>)
        // based on whether the first list item starts with "* ", "- " (asterisk or dash followed by space).
        let listType = (list[0].startsWith('* ') || list[0].startsWith('- ')) ? 'ul' : 'ol';
  
        // Create the HTML list and append it to the formatted lines of text.
        formattedLines.push(
          React.createElement(
            listType,
            null,
            list.map((item, index) => {
              // Remove the list marker ("* ", "- " or "N. ") from the start of the item.
              const content = item.startsWith('* ') ? item.slice(2) : item.startsWith('- ') ? item.slice(2) : item.slice(item.indexOf('.') + 2);
              // Return an HTML list item (<li>).
              return <li key={index}>{content}</li>;
            })
          )
        );
        
        // Clear the list items.
        list = [];
      }
    };
  
    // Iterate over the lines of text.
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
  
      // If the line is a list item (starts with "* ", "- " or "N. "), add it to the list of items.
      // Otherwise, process the list items collected so far and add the line to the formatted lines of text.
      if (line.startsWith('* ') || line.startsWith('- ') || line.match(/^\d+\./)) {
        list.push(line);
      } else {
        processList();
        formattedLines.push(line);
      }
    }
  
    // Process any remaining list items.
    processList(); 
    
    // Return the formatted lines of text.
    return formattedLines;
  }

  
  return (
    <div className="chat-ai">
      {!loading && !user &&  <SignIn handleSignIn={handleSignIn} handleSignInWithEmail={handleSignInWithEmail} handleSignUpWithEmail={handleSignUpWithEmail} />}
      {user && (
        <>
          <ConversationList
            setConversationId={setConversationId}
            setMessages={setMessages}
            handleSignOut={handleSignOut}
            systemMessageText={systemMessageText}
            setSystemMessageText={setSystemMessageText}
            />
          <div className="chat-container" style={{ overflowY: 'scroll' }} ref={messageListRef}>
            <div className="message-list-container">
              <div className="message-list">
                {messages.map((message, i) => {
                  // Split the message into different parts based on '```' delimiter
                  const messageParts = message.message.split('```');
                  return (
                    <div
                      key={i}
                      className={`message ${
                        message.direction === 'incoming' ? 'message-incoming' : 'message-outgoing'
                      }`}
                    >
                      {messageParts.map((messagePart, j) => {
                        const isCodeSnippet = j % 2 === 1;
                        if (isCodeSnippet) {
                          const codeLanguage = messagePart.split('\n')[0];
                          const codeSnippet = messagePart.replace(codeLanguage + '\n', '');
                  
                          return (
                            <SyntaxHighlighter className="highlighter"language={codeLanguage || 'javascript'} style={twilight} key={`${i}-${j}`}>
                              {codeSnippet}
                            </SyntaxHighlighter>
                          );
                        } else {
                          const inlineCodeParts = messagePart.split('`');
                          return inlineCodeParts.map((inlinePart, k) => {
                            const isInlineCode = k % 2 === 1;
                            if (isInlineCode) {
                              return <span className="inline-code" key={`${i}-${j}-${k}`}>{inlinePart}</span>
                            } else {
                              return formatLists(inlinePart).map((formattedLine, l) => (
                                <span key={`${i}-${j}-${k}-${l}`}>{formattedLine}</span>
                              ));
                            }
                          });
                        }
                      })}
                    </div>
                  );                  
                })}
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
          
          {/* To display the personality options select at teh bottom of the view */}
          {/* <div className="system-message-container">
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
          </div> */}
        </>
      )}
    </div>
  );
}

export default ChatAI
