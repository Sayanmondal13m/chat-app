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

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
  
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
        setChatList(
          chatList.map((user) => ({
            username: user,
            unread: unread ? unread[user] || 0 : 0,
          }))
        );
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