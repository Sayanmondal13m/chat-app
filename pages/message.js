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
  const messagesEndRef = useRef(null);

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

    // Listener for real-time messages
    const handleNewMessage = ({ from, message }) => {
      if (from === chatWith) {
        setMessages((prevMessages) => [...prevMessages, message]);
        showNotification(from, message.text);
      }
    };

    socket.on(`message-received-${storedUsername}`, handleNewMessage);

    // Cleanup function to remove listener
    return () => {
      socket.off(`message-received-${storedUsername}`, handleNewMessage);
    };
  }, [chatWith, router]);

  useEffect(() => {
    // Scroll to the bottom of the messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const message = {
      from: username,
      to: chatWith,
      message: newMessage.trim(),
    };

    // Send message to the server
    socket.emit('send-message', message);
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: username, text: newMessage.trim(), timestamp: new Date().toISOString() },
    ]);
    setNewMessage('');
  };

  const subscribeToNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.register('/custom-sw.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BEgrq4Ls6ZiFuDQErAqEK0UAG0ZyfZxUykXiAHjM42Cwk2yIdcIOwkt0jSnp13QVdg9Nh7N36b_ob9WJNTeggFY', // Replace with your public VAPID key
      });
  
      // Send subscription to the server
      await fetch('https://rust-mammoth-route.glitch.me/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: localStorage.getItem('username'),
          subscription,
        }),
      });
  
      console.log('Subscribed to notifications');
    } else {
      console.error('Push notifications are not supported in this browser');
    }
  };
  
  // Call the function on page load
  useEffect(() => {
    subscribeToNotifications();
  }, []);  

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
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
  
      {/* Input Section */}
      <footer className={styles.footer}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
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