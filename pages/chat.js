import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import styles from '../styles/Chat.module.css';

const socket = io('https://rust-mammoth-route.glitch.me'); // Replace with your server URL

export default function Chat() {
  const [username, setUsername] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [chatList, setChatList] = useState([]);
  const router = useRouter();

    // Register Service Worker
 // Public VAPID Key (replace this with your server's public key)
 const publicVapidKey = 'BPyxpfIOEiNyuebIoGjO5G0rQXVMNbEnr7WpOOr-dHavOiXsw-ZUGA5yfFn6asRNfvCxlsirjfbAClpyT2rnwLc';

 // Register Service Worker and Subscribe to Push Notifications
// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Register Service Worker and Subscribe to Push Notifications
useEffect(() => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);

        // Ensure PushManager is available and subscribe
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey), // Convert the public VAPID key
        });
      })
      .then((subscription) => {
        console.log('Push subscription:', subscription);

        // Send subscription to the server
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
          fetch('https://rust-mammoth-route.glitch.me/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: storedUsername, subscription }),
          });
        }
      })
      .catch((err) => console.error('Push subscription failed:', err));
  } else {
    console.warn('Service Worker or Push Notifications are not supported in this browser.');
  }
}, []);

useEffect(() => {
  const storedUsername = localStorage.getItem('username');
  if (storedUsername) {
    setUsername(storedUsername);

    // Request Notification Permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission()
        .then((permission) => {
          if (permission === 'granted') {
            console.log('Notification permission granted.');
          } else if (permission === 'denied') {
            console.warn('Notification permission denied.');
          }
        })
        .catch((err) => console.error('Error requesting notification permission:', err));
    }

    // Fetch initial chat list with unread counts
    fetch('https://rust-mammoth-route.glitch.me/fetch-chat-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: storedUsername }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.chatList) {
          setChatList(data.chatList);
        }
      })
      .catch((err) => console.error('Error fetching chat list:', err));

    // Listen for chat list updates
    socket.on(`chat-list-updated-${storedUsername}`, ({ chatList, unread }) => {
      try {
        setChatList((prevChatList) => {
          const updatedChatList = chatList.map((user) => {
            const existingChat = prevChatList.find((chat) => chat.username === user);
            const newUnreadCount = unread ? unread[user] || 0 : 0;

            // Trigger a notification if the unread count increased
            if (
              existingChat &&
              newUnreadCount > (existingChat.unread || 0) &&
              navigator.serviceWorker
            ) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification('New Message', {
                  body: `You have an unread message from ${user}`,
                  icon: '/chat192.png', // Replace with your app's icon URL
                  vibrate: [200, 100, 200], // Vibration pattern
                  tag: user, // Ensures only one notification per user
                });
              });
            }

            return { username: user, unread: newUnreadCount };
          });

          return updatedChatList;
        });
      } catch (error) {
        console.error('Error handling chat list updates:', error);
      }
    });
  } else {
    router.push('/');
  }
}, []);
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('username'); // Clear user data from localStorage
    router.push('/'); // Redirect to login/register page
  };

  // Handle user search
  const handleSearch = async () => {
    if (!searchUsername) return;

    const response = await fetch('https://rust-mammoth-route.glitch.me/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: searchUsername }),
    });

    if (response.ok) {
      setSearchResult(searchUsername); // Username found
    } else {
      setSearchResult(null);
      alert('User not found.');
    }
  };

  // Handle adding a user to the chat list
  const handleAddChat = () => {
    if (searchResult) {
      // Call the REST endpoint to update the chat list
      fetch('https://rust-mammoth-route.glitch.me/update-chat-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1: username, user2: searchResult }),
      })
        .then((res) => res.json())
        .then(() => {
          console.log(`Chat list updated between ${username} and ${searchResult}`);
        })
        .catch((err) => console.error('Error updating chat list:', err));
  
      // Immediately clear the search result
      setSearchResult(null);
    }
  };  

  // Handle deleting a user from the chat list
  const handleDeleteChat = (user) => {
    fetch('https://rust-mammoth-route.glitch.me/delete-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user1: username, user2: user }),
    })
      .then(() => {
        setChatList(chatList.filter((chat) => chat.username !== user)); // Ensure the chat list is updated locally
      })
      .catch((err) => console.error('Failed to delete chat:', err));
  };  

  // Handle clicking a chat item
  const handleChatClick = (user) => {
    fetch('https://rust-mammoth-route.glitch.me/clear-unread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewer: username, chatWith: user }),
    })
      .then(() => {
        console.log(`Unread count cleared for chat with ${user}`);
      })
      .catch((err) => console.error('Error clearing unread:', err));
  
    router.push(`/message?chatWith=${user}`); // Redirect to the message page
  };    

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Chat Page</h1>
        <div className={styles.userInfo}>
          <span className={styles.loggedIn}>
            Logged in as: <strong>{username}</strong>
          </span>
          <br />
          <button className={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className={styles.searchSection}>
        <input
          type="text"
          placeholder="Search username"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          className={styles.searchInput}
        />
        <button className={styles.searchButton} onClick={handleSearch}>
          Search
        </button>
      </section>

      {searchResult && (
        <div className={styles.searchResult}>
          <p>
            User found: <strong>{searchResult}</strong>
          </p>
          <button className={styles.addChatButton} onClick={handleAddChat}>
            Add to Chat
          </button>
        </div>
      )}

<section className={styles.chatsSection}>
  <h2 className={styles.chatsTitle}>Chats</h2>
  {chatList.length === 0 ? (
    <p className={styles.noChats}>No chats available. Start a conversation!</p>
  ) : (
    chatList.map(({ username: user, unread }) => (
      <div key={user} className={styles.chatCard}>
        <span className={styles.chatUser}>
          {user} {unread > 0 && <span className={styles.unreadCount}>({unread})</span>}
        </span>
        <div className={styles.chatButtons}>
          <button className={styles.chatButton} onClick={() => handleChatClick(user)}>
            Chat
          </button>
          <button className={styles.deleteButton} onClick={() => handleDeleteChat(user)}>
            Delete
          </button>
        </div>
      </div>
    ))
  )}
</section>
    </div>
  );
}