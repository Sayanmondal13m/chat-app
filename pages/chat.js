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

      // Fetch the user's chat list from the server
      fetch('https://rust-mammoth-route.glitch.me/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: storedUsername, password: '' }), // Empty password for validation
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.chatList) {
            setChatList(data.chatList); // Update the chat list
          } else {
            console.error('Error: Chat list not found in response:', data);
          }
        })
        .catch((err) => console.error('Error fetching chat list:', err));

      // Subscribe to real-time chat list updates
      socket.on(`chat-list-updated-${storedUsername}`, (updatedChatList) => {
        setChatList(updatedChatList); // Update chat list in real time
      });
    } else {
      // Redirect to login/register page if no username is found
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
      socket.emit('update-chat-list', { user1: username, user2: searchResult });

      // Optionally, call the REST endpoint for redundancy
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

      setSearchResult(null); // Clear the search result
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
        setChatList(chatList.filter((u) => u !== user)); // Update locally
      })
      .catch((err) => console.error('Failed to delete chat:', err));
  };

  // Handle clicking a chat item
  const handleChatClick = (user) => {
    router.push(`/message?chatWith=${user}`); // Redirect to message page
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
          chatList.map((user) => (
            <div key={user} className={styles.chatCard}>
              <span className={styles.chatUser}>{user}</span>
              <div className={styles.chatButtons}>
                <button className={`${styles.chatButton}`} onClick={() => handleChatClick(user)}>
                  Chat
                </button>
                <button className={`${styles.deleteButton}`} onClick={() => handleDeleteChat(user)}>
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