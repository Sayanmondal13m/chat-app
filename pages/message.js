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
  const [selectedFile, setSelectedFile] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // Track message being replied to
  const [isSending, setIsSending] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [stickerMode, setStickerMode] = useState(false); // To handle Sticker mode visibility
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isTyping, setIsTyping] = useState(false); // Typing indicator
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);

   // Scroll to the bottom function
   const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle user scrolling in the message container
  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (container) {
      const atBottom =
        container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      setIsNearBottom(atBottom);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

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
    if (username && chatWith && messages.length > 0) {
      socket.emit('message-seen', { viewer: username, sender: chatWith });
    }
  }, [username, chatWith, messages]);

  // Scroll to the bottom of the messages whenever messages change
 // Attach scroll event listener
 useEffect(() => {
  const container = messageContainerRef.current;
  if (container) {
    container.addEventListener('scroll', handleScroll);
  }
  return () => {
    if (container) {
      container.removeEventListener('scroll', handleScroll);
    }
  };
}, []);

// Scroll to the bottom when messages change if user is near the bottom
useEffect(() => {
  if (isNearBottom) {
    scrollToBottom();
  }
}, [messages]);  

  // Real-time message updates
  useEffect(() => {
    const handleNewMessage = ({ from, message }) => {
      if (from === chatWith) {
        setMessages((prevMessages) => [...prevMessages, message]);

      // Clear unread count in real-time
      fetch('https://rust-mammoth-route.glitch.me/clear-unread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewer: username, chatWith }),
      }).catch((err) => console.error('Error clearing unread in real-time:', err));
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

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const handleStickerClick = () => {
    // Placeholder for sticker functionality
    console.log('Sticker button clicked!');
  };

  // Send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    let uploadedFileUrl = null;
    setIsSending(true);

    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const response = await fetch('https://rust-mammoth-route.glitch.me/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          uploadedFileUrl = data.fileUrl;
        }
      } catch (error) {
        console.error('File upload failed:', error);
        setIsSending(false);
        return;
      }
    }

    const message = {
      from: username,
      to: chatWith,
      message: newMessage.trim(),
      file: uploadedFileUrl,
      replyTo: replyingTo ? { sender: replyingTo.sender, text: replyingTo.text.substring(0, 20) } : null,
    };

    socket.emit('send-message', message);

    setMessages((prev) => [
      ...prev,
      { sender: username, text: newMessage.trim(), file: uploadedFileUrl, timestamp: new Date().toISOString(), seen: false, replyTo: message.replyTo },
    ]);

    setNewMessage('');
    setSelectedFile(null);
    setReplyingTo(null);
    setIsSending(false);
  };

  // Notify typing
  const handleTyping = () => {
    socket.emit('typing', { from: username, to: chatWith });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h3>Chatting with: {chatWith}</h3>
        <button onClick={() => router.push('/chat')} className={styles.exitButton}>
          Exit
        </button>
      </header>

      <div className={styles.messageContainer} ref={messageContainerRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.message} ${msg.sender === username ? styles.sent : styles.received}`}
          >
            <div className={styles.messageContent}>
            {msg.replyTo && (
  <div className={styles.repliedMessage}>
    <small>Replying to: {msg.replyTo.text}</small>
  </div>
)}
              {msg.text && <p>{msg.text}</p>}
              {msg.file && (
                <>
                  {msg.file.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                    <img src={msg.file} alt="shared" className={styles.sharedImage} />
                  ) : msg.file.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video controls className={styles.sharedVideo}>
                      <source src={msg.file} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <a href={msg.file} download className={styles.sharedFile}>
                      Download File
                    </a>
                  )}
                </>
              )}
              <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
              {msg.sender === username && msg.seen && <span>Seen</span>}
              <button className={styles.replyButton} onClick={() => setReplyingTo(msg)}>^</button>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        {isTyping && <p className={styles.typingIndicator}>Typing...</p>}
      </div>

      <footer className={styles.footer}>
      {replyingTo && (
  <div className={styles.replyIndicator}>
    <span>Replying to: {replyingTo.text.substring(0, 20)}...</span>
    <button onClick={() => setReplyingTo(null)} className={styles.cancelReplyButton}>Cancel</button>
  </div>
)}
<div className={styles.fileInputContainer}>
        <label onClick={togglePopup} className={styles.plusButton}>
          +
        </label>
        {isPopupOpen && (
          <div className={styles.popup}>
            <button
              onClick={() => document.getElementById('fileInput').click()}
              className={styles.popupButton}
            >
              File
            </button>
            <button onClick={() => setStickerMode(true)}
              className={styles.popupButton}
            >
              Stickers
            </button>
          </div>
        )}
        <input
          id="fileInput"
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {selectedFile && <span className={styles.fileSelected}>1 item selected</span>}
      </div>
      {stickerMode ? (
        <div className={styles.stickerContainer}>
          <p>You can upload stickers here later</p>
          <button onClick={() => setStickerMode(false)} className={styles.exitStickerButton}>
            Exit Stickers
          </button>
        </div>
      ) : (
        <>
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
      <button
        onClick={handleSendMessage}
        className={styles.sendButton}
        disabled={isSending}
      >
        {isSending ? 'Sending...' : 'Send'}
      </button>
      </>
      )}
    </footer>
  </div>
);
}