import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import styles from '../styles/Message.module.css';

// Replace with your server URL
const socket = io('https://rust-mammoth-route.glitch.me');

export default function Message() {
  const router = useRouter();
  const { chatWith } = router.query; // Get the username from the query parameters
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false); // Typing indicator
  const messagesEndRef = useRef(null);

  // Fetch messages and clear unread count
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      router.push('/');
      return;
    }

    setUsername(storedUsername);

    // Fetch message history from the server
    fetch('https://rust-mammoth-route.glitch.me/fetch-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user1: storedUsername, user2: chatWith }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
        }
      })
      .catch((err) => console.error('Error fetching messages:', err));
  }, [chatWith, router]);

  // Clear unread count when the page is loaded
  useEffect(() => {
    if (username && chatWith) {
      fetch('https://rust-mammoth-route.glitch.me/clear-unread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewer: username, chatWith }),
      }).catch((err) => console.error('Error clearing unread:', err));
    }
  }, [username, chatWith]);

  // Notify server about seen messages
  useEffect(() => {
    if (messages.length > 0) {
      socket.emit('message-seen', { viewer: username, sender: chatWith });
    }
  }, [messages, username, chatWith]);

  // Scroll to the bottom of the messages whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time message updates
  useEffect(() => {
    const handleNewMessage = ({ from, message }) => {
      if (from === chatWith) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };

    const handleTyping = ({ from }) => {
      if (from === chatWith) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000); // Reset typing indicator after 2 seconds
      }
    };

    const handleSeen = ({ viewer }) => {
      if (viewer === chatWith) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => ({ ...msg, seen: true }))
        );
      }
    };

    socket.on(`message-received-${username}`, handleNewMessage);
    socket.on(`typing-${username}`, handleTyping);
    socket.on(`message-seen-${username}`, handleSeen);

    return () => {
      socket.off(`message-received-${username}`, handleNewMessage);
      socket.off(`typing-${username}`, handleTyping);
      socket.off(`message-seen-${username}`, handleSeen);
    };
  }, [chatWith, username]);

  // Send a new message
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const message = {
      from: username,
      to: chatWith,
      message: newMessage.trim(),
    };

    // Send the message to the server
    socket.emit('send-message', message);

    // Update local messages
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: username, text: newMessage.trim(), timestamp: new Date().toISOString(), seen: false },
    ]);
    setNewMessage('');
  };

  // Notify typing
  const handleTyping = () => {
    socket.emit('typing', { from: username, to: chatWith });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h3>Chatting with: {chatWith}</h3>
        <button onClick={() => router.push('/chat')} className={styles.exitButton}>
          Exit
        </button>
      </header>

      {/* Message Display */}
      <div className={styles.messageContainer}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.message} ${msg.sender === username ? styles.sent : styles.received}`}
          >
            <div className={styles.messageContent}>
              <p>{msg.text}</p>
              <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
              {msg.sender === username && msg.seen && <span>Seen</span>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        {isTyping && <p className={styles.typingIndicator}>Typing...</p>}
      </div>

      {/* Input Section */}
      <footer className={styles.footer}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message"
          className={styles.input}
        />
        <button onClick={handleSendMessage} className={styles.sendButton}>
          Send
        </button>
      </footer>
    </div>
  );
}