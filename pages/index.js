import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/LoginPage.module.css';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeAction, setActiveAction] = useState(null); // Tracks which button is active: "register" or "login"
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      validateUser(storedUsername);
    }
  }, []);

  const validateUser = async (storedUsername) => {
    const response = await fetch('https://rust-mammoth-route.glitch.me/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: storedUsername, password: '' }), // Empty password for validation
    });

    if (response.ok) {
      router.push('/chat'); // Redirect to chat page if valid
    } else {
      localStorage.removeItem('username'); // Clear invalid username
    }
  };

  const handleSubmit = async (isRegistration) => {
    if (activeAction) return; // Prevent multiple simultaneous requests
    setActiveAction(isRegistration ? 'register' : 'login'); // Track which button triggered the action

    const endpoint = isRegistration
      ? 'https://rust-mammoth-route.glitch.me/register'
      : 'https://rust-mammoth-route.glitch.me/login';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    setActiveAction(null); // Reset the action after the request
    if (response.ok) {
      localStorage.setItem('username', username); // Store username in localStorage
      setMessage('Success! Redirecting...');
      router.push('/chat'); // Redirect to chat page
    } else {
      setMessage(data.message || 'Something went wrong');
    }
  };

  return (
    <div className={styles.container}>
      {/* Background iframe */}
      <iframe
        src="/nice.html"
        className={styles.background}
        title="Background Animation"
        frameBorder="0"
        scrolling="no"
      ></iframe>

      {/* Login Card */}
      <div className={styles.card}>
        <h1>Welcome</h1>
        <input
          className={styles.input}
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className={styles.button}
          onClick={() => handleSubmit(true)} // Register functionality
          disabled={activeAction === 'register'}
        >
          {activeAction === 'register' ? 'Registering...' : 'Register'}
        </button>
        <button
          className={styles.button}
          onClick={() => handleSubmit(false)} // Login functionality
          disabled={activeAction === 'login'}
        >
          {activeAction === 'login' ? 'Logging in...' : 'Login'}
        </button>
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
}