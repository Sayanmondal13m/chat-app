const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// File to store user data
const dataFilePath = path.join(__dirname, 'users.json');

// Helper functions to manage persistent storage
function loadUserData() {
  if (fs.existsSync(dataFilePath)) {
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
  }
  return {};
}

function saveUserData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Initialize users object
let users = loadUserData();

// Create HTTP and WebSocket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Real-time communication
io.on('connection', (socket) => {
  console.log('A user connected.');

socket.on('update-chat-list', ({ user1, user2 }) => {
  if (users[user1] && users[user2]) {
    if (!users[user1].chatList.includes(user2)) {
      users[user1].chatList.push(user2);
    }
    if (!users[user2].chatList.includes(user1)) {
      users[user2].chatList.push(user1);
    }

    saveUserData(users);

    io.emit(`chat-list-updated-${user1}`, users[user1].chatList);
    io.emit(`chat-list-updated-${user2}`, users[user2].chatList);
  }
});

  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

// Register Endpoint
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (users[username]) {
    return res.status(400).json({ message: 'Username is already taken' });
  }

  users[username] = { password, chatList: [] };
  saveUserData(users); // Save updated users
  return res.status(201).json({ message: 'User registered successfully' });
});

// Login Endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  if (users[username] && (password === '' || users[username].password === password)) {
    return res.status(200).json({ message: 'Login successful', chatList: users[username].chatList });
  }

  return res.status(401).json({ message: 'Invalid username or password' });
});

// Validate Username
app.post('/validate', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  if (users[username]) {
    return res.status(200).json({ message: 'Username valid' });
  }

  return res.status(401).json({ message: 'Invalid username' });
});

// Delete Chat Endpoint
app.post('/delete-chat', (req, res) => {
  const { user1, user2 } = req.body;

  if (!user1 || !user2) {
    return res.status(400).json({ message: 'Both users are required' });
  }

  // Remove user2 from user1's chat list
  if (users[user1] && users[user1].chatList) {
    users[user1].chatList = users[user1].chatList.filter((u) => u !== user2);
  }

  // Remove user1 from user2's chat list
  if (users[user2] && users[user2].chatList) {
    users[user2].chatList = users[user2].chatList.filter((u) => u !== user1);
  }

  // Save updated user data
  saveUserData(users);

  // Emit real-time updates
  io.emit(`chat-list-updated-${user1}`, users[user1].chatList);
  io.emit(`chat-list-updated-${user2}`, users[user2].chatList);

  return res.status(200).json({ message: 'Chat deleted successfully' });
});

// Start the Server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});