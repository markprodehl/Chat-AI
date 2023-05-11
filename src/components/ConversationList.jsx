import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import db from '../config/firebaseConfig';
import PropTypes from 'prop-types';
import { IoIosMenu } from 'react-icons/io';

function ConversationList({ setConversationId, setMessages }) {
  const [conversations, setConversations] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      const q = query(collection(db, 'conversations'), orderBy('lastUpdated', 'desc'));
      const querySnapshot = await getDocs(q);
      const conversationsArray = [];
      querySnapshot.forEach((doc) => {
        conversationsArray.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setConversations(conversationsArray);
    };

    fetchConversations();
  }, []);

  const handleConversationClick = (conversation) => {
    setConversationId(conversation.id);
    const messagesArray = conversation.messages.map((messageObj) => ({
      message: messageObj.userMessage,
      sender: 'user',
      direction: 'outgoing',
    }));
    setMessages(messagesArray);
    setIsOpen(false); // close the menu when a conversation is clicked
  };

  return (
    <div className="conversation-list">
      <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
        <IoIosMenu size={24} />
      </div>
      {isOpen && conversations.map((conversation, index) => (
        <div
          key={index}
          className="conversation-item"
          onClick={() => handleConversationClick(conversation)}
        >
          Conversation {index + 1}
        </div>
      ))}
    </div>
  );
}

ConversationList.propTypes = {
  setConversationId: PropTypes.func.isRequired,
  setMessages: PropTypes.func.isRequired,
};

export default ConversationList;
