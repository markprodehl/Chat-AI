import { useEffect, useState, useRef } from 'react';
import { collection, getDocs, query, orderBy, doc } from 'firebase/firestore';
import { db, auth } from '/src/config/firebaseConfig.js';
import PropTypes from 'prop-types';
import { IoIosMenu } from 'react-icons/io';
function ConversationList({ setConversationId, setMessages, handleSignOut }) {
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
        {/* <div className={`${isOpen ? 'show-title' : 'hide-title'}`}>Conversation History</div> */}
      </div>
  
      {isOpen && (
        <>
          {conversations.slice().reverse().map((conversation, index) => {
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
          <div className="conversation-item sign-out" onClick={handleSignOut}>
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
};

export default ConversationList;
