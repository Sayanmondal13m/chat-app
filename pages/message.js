import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import styles from '../styles/Message.module.css';

// Replace with your server URL
const socket = io('https://rust-mammoth-route.glitch.me');

export default function Message() {
  const router = useRouter();
  const { chatWith, currentUsername } = router.query; // Get the username from the query parameters
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
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);

  const hardcodedStickers = [
  '/stickers/s-1.gif',
  '/stickers/s-2.gif',
  '/stickers/s-3.gif',
  '/stickers/s-4.gif',
  '/stickers/s-5.gif',
  '/stickers/s-6.gif',
  '/stickers/s-7.gif',
  '/stickers/s-8.gif',
  '/stickers/s-9.gif',
  '/stickers/s-10.gif',
  '/stickers/s-11.gif',
  '/stickers/s-12.gif',
  '/stickers/s-13.gif',
  '/stickers/s-14.gif',
  '/stickers/s-15.gif',
  '/stickers/s-16.gif',
  '/stickers/s-17.gif',
  '/stickers/s-18.gif',
  '/stickers/s-19.gif',
  '/stickers/s-20.gif',
  '/stickers/s-21.gif',
  '/stickers/s-22.gif',
  '/stickers/s-23.gif',
  '/stickers/s-24.gif',
  '/stickers/s-25.gif',
  '/stickers/s-26.gif',
  '/stickers/s-27.gif',
  '/stickers/s-28.gif',
  '/stickers/s-29.gif',
  '/stickers/s-30.gif',
  '/stickers/s-31.gif',
  '/stickers/s-32.gif',
];

let scrollDebounce = null;

   // Scroll to the bottom function
   const scrollToBottom = () => {
    const container = messageContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
    setIsNearBottom(true); // Reset near-bottom state
    setShowScrollToBottom(false); // Hide button
  };  

  // Handle user scrolling in the message container
  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (container) {
      const atBottom =
        container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      setIsNearBottom(atBottom); // Update whether user is at the bottom
      setShowScrollToBottom(!atBottom);
    }
  };  

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      if (scrollDebounce) {
        clearTimeout(scrollDebounce);
      }
    };
  }, []);

  useEffect(() => {
    const container = messageContainerRef.current;
    let scrollTimeout;
  
    const handleDebouncedScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => handleScroll(), 100); // Debounced scroll handling
    };
  
    if (container) {
      container.addEventListener('scroll', handleDebouncedScroll);
    }
  
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleDebouncedScroll);
      }
      clearTimeout(scrollTimeout);
    };
  }, []);  
  
  // Scroll to the bottom when messages change if user is near the bottom
  useEffect(() => {
    const container = messageContainerRef.current;
    if (isNearBottom && container) {
      container.scrollTop = container.scrollHeight; // Auto-scroll only when at the bottom
    }
  }, [messages]);  

  // Fetch messages and clear unread count
  useEffect(() => {
    if (!router.isReady) return; // Wait for router to be ready
  
    if (!currentUsername || !chatWith) {
      console.error("Missing parameters: currentUsername or chatWith");
      return; // Do not redirect immediately; handle it gracefully
    }
  
    setUsername(currentUsername);
  
    // Fetch message history from the server
    fetch('https://rust-mammoth-route.glitch.me/fetch-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user1: currentUsername, user2: chatWith }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
      })
      .catch((err) => console.error('Error fetching messages:', err));
  }, [router.isReady, currentUsername, chatWith]);
  

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
    setStickerMode(false); // Ensure sticker mode is off
  };

  const handleStickerClick = () => {
    setIsPopupOpen(false); // Close popup
    setStickerMode(true); // Open sticker mode
    setNewMessage(''); // Clear input field
  };

  const handleSendSticker = (stickerUrl) => {
    const message = {
      from: username,
      to: chatWith,
      message: '', // Stickers don't have text
      file: stickerUrl,
    };
  
    socket.emit('send-message', message);
  
    setMessages((prev) => [
      ...prev,
      { sender: username, text: '', file: stickerUrl, timestamp: new Date().toISOString(), seen: false },
    ]);
  
    setStickerMode(false); // Close sticker mode after sending
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
      <button
  onClick={() => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('exit'); // Notify the app to navigate back
    }
  }}
  className={styles.exitButton}
>
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

      {showScrollToBottom && (
  <div className={styles.glassButton} onClick={scrollToBottom}>
    <span>↓</span>
    {Array.from({ length: 20 }).map((_, index) => (
      <div key={index} className={styles.waterDrop}></div>
    ))}
  </div>
)}
    </div>

    <footer className={styles.footer}>
  {replyingTo && (
    <div className={styles.replyIndicator}>
      <span>Replying to: {replyingTo.text.substring(0, 20)}...</span>
      <button onClick={() => setReplyingTo(null)} className={styles.cancelReplyButton}>
        Cancel
      </button>
    </div>
  )}

  {/* "+" Button Section */}
  <div className={styles.fileInputContainer}>
    <label onClick={togglePopup} className={styles.plusButton}>+</label>
    {isPopupOpen && (
      <div className={styles.popup}>
        <button
          onClick={() => document.getElementById('fileInput').click()}
          className={styles.popupButton}
        >
          File
        </button>
        <button onClick={handleStickerClick} className={styles.popupButton}>
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

  {/* Input and Send Button Section */}
  <div className={styles.inputContainer}>
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
  </div>

  {/* Stickers Section */}
  {stickerMode && (
    <div className={styles.stickerContainer}>
      <div className={styles.stickerGrid}>
        {hardcodedStickers.map((stickerUrl, index) => (
          <img
            key={index}
            src={stickerUrl}
            alt={`Sticker ${index + 1}`}
            onClick={() => handleSendSticker(stickerUrl)}
          />
        ))}
      </div>
      <button onClick={() => setStickerMode(false)} className={styles.exitStickerButton}>
        Exit Stickers
      </button>
    </div>
  )}
</footer>
  </div>
)};