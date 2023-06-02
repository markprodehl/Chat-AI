import { useEffect, useState, useRef } from 'react';
import { collection, getDocs, query, orderBy, doc } from 'firebase/firestore';
import { db, auth } from '/src/config/firebaseConfig.js';
import PropTypes from 'prop-types';
import { IoIosMenu } from 'react-icons/io';
import personalityOptions from './PersonalityOptions';
function ConversationList({ setConversationId, setMessages, handleSignOut, systemMessageText, setSystemMessageText}) {
  const [conversations, setConversations] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const conversationListRef = useRef(null); 

  useEffect(() => {
    const fetchConversations = async () => {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const userRef = doc(db, 'users', userId);
        const q = query(
          collection(userRef, 'conversations'),
          orderBy('lastUpdated', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const conversationsArray = [];
        querySnapshot.forEach((doc) => {
          conversationsArray.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setConversations(conversationsArray);
      }
    };
  
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchConversations();
      }
    });
  
    return () => {
      unsubscribe();
    };
  }, []);
  

  const handleConversationClick = (conversation) => {
    setConversationId(conversation.id);
  
    const messagesArray = conversation.messages.flatMap((messageObj) => [
      {
        message: messageObj.userMessage,
        sender: 'user',
        direction: 'outgoing',
      },
      {
        message: messageObj.aiResponse,
        sender: 'ChatGPT',
        direction: 'incoming',
      },
    ]);
  
    setMessages(messagesArray);
    setIsOpen(false); // close the menu when a conversation is clicked
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && conversationListRef.current && !conversationListRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`conversation-list ${isOpen ? 'list-open' : 'list-closed'}`} ref={conversationListRef}>
      <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
        <div className={`${isOpen ? 'hide-icon' : ''}`}>
          <IoIosMenu size={24} />
        </div>
      </div>

      {isOpen && (
        <>
          <details className="dropdown">
            <summary style={{ listStyle: 'none' }}>Conversation History</summary>
            {conversations.slice().map((conversation, index) => {
              const firstMessage = conversation.messages[0]?.userMessage || '';
              const previewText = firstMessage.length > 30
                ? `${firstMessage.slice(0, 20)}...`
                : firstMessage;

              return (
                <div
                  key={index}
                  className="conversation-item"
                  onClick={() => handleConversationClick(conversation)}
                >
                  {previewText}
                </div>
              );
            })}
          </details>
          
          <details className="dropdown">
            <summary style={{ listStyle: 'none' }}>Personality Settings</summary>
            {personalityOptions.map((option, index) => (
              <div
                key={index}
                className={`conversation-item ${systemMessageText === option.value ? 'selected-option' : ''}`}
                onClick={() => {
                  setSystemMessageText(option.value);
                  setIsOpen(false); // Close the menu after selecting an option
                }}
              >
                {option.label}
                {systemMessageText === option.value ? ' *' : ''}
              </div>
            ))}
          </details>

          <div className="dropdown sign-out" onClick={handleSignOut}>
            Sign Out
          </div>
        </>
      )}
    </div>
  );
}

ConversationList.propTypes = {
  setConversationId: PropTypes.func.isRequired,
  setMessages: PropTypes.func.isRequired,
  handleSignOut: PropTypes.func.isRequired, // Add handleSignOut prop
  systemMessageText: PropTypes.string.isRequired,
  setSystemMessageText: PropTypes.func.isRequired,
};

export default ConversationList;
