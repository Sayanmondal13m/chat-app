const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const fs = require('fs');
const path = require('path');
const webPush = require('web-push');

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

// VAPID Keys for Push Notifications
const publicVapidKey = 'YOUR_PUBLIC_VAPID_KEY'; // Replace with your public key
const privateVapidKey = 'YOUR_PRIVATE_VAPID_KEY'; // Replace with your private key

webPush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your email
  publicVapidKey,
  privateVapidKey
);

// Store user subscriptions
let subscriptions = {};

// Endpoint to save subscription
app.post('/subscribe', (req, res) => {
  const { username, subscription } = req.body;

  if (!username || !subscription) {
    return res.status(400).json({ message: 'Username and subscription are required' });
  }

  subscriptions[username] = subscription;
  res.status(201).json({ message: 'Subscription saved' });
});

// Send a push notification
const sendNotification = (username, payload) => {
  const subscription = subscriptions[username];
  if (subscription) {
    webPush
      .sendNotification(subscription, JSON.stringify(payload))
      .catch((error) => console.error('Error sending notification:', error));
  }
};

// Real-time communication with Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('send-message', ({ from, to, message }) => {
    if (users[from] && users[to]) {
      if (!users[from].messages) users[from].messages = {};
      if (!users[to].messages) users[to].messages = {};

      if (!users[from].messages[to]) users[from].messages[to] = [];
      if (!users[to].messages[from]) users[to].messages[from] = [];

      const msg = { sender: from, text: message, timestamp: new Date().toISOString() };
      users[from].messages[to].push(msg);
      users[to].messages[from].push(msg);

      saveUserData(users);

      // Notify the recipient in real-time
      io.emit(`message-received-${to}`, { from, message: msg });

      // Send push notification
      sendNotification(to, {
        title: 'New Message',
        body: `New message from ${from}: ${message}`,
      });
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

  users[username] = { password, chatList: [], messages: {} };
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
    return res.status(200).json({
      message: 'Login successful',
      chatList: users[username].chatList,
    });
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
  
  // Fetch Chat List
  app.post('/fetch-chat-list', (req, res) => {
    const { username } = req.body;
  
    if (!username || !users[username]) {
      return res.status(400).json({ message: 'Invalid username' });
    }
  
    return res.status(200).json({ chatList: users[username].chatList });
  });
  
  // Update Chat List
  app.post('/update-chat-list', (req, res) => {
    const { user1, user2 } = req.body;
  
    if (!user1 || !user2 || !users[user1] || !users[user2]) {
      return res.status(400).json({ message: 'Both users are required' });
    }
  
    if (!users[user1].chatList.includes(user2)) {
      users[user1].chatList.push(user2);
    }
    if (!users[user2].chatList.includes(user1)) {
      users[user2].chatList.push(user1);
    }
  
    saveUserData(users);
    io.emit(`chat-list-updated-${user1}`, users[user1].chatList);
    io.emit(`chat-list-updated-${user2}`, users[user2].chatList);
  
    return res.status(200).json({ message: 'Chat list updated' });
  });

// Fetch Messages Between Two Users
app.post('/fetch-messages', (req, res) => {
  const { user1, user2 } = req.body;

  if (!user1 || !user2) {
    return res.status(400).json({ message: 'Both users are required' });
  }

  if (users[user1] && users[user1].messages && users[user1].messages[user2]) {
    return res.status(200).json({ messages: users[user1].messages[user2] });
  }

  return res.status(200).json({ messages: [] });
});

// Delete Chat
app.post('/delete-chat', (req, res) => {
  const { user1, user2 } = req.body;

  if (!user1 || !user2 || !users[user1] || !users[user2]) {
    return res.status(400).json({ message: 'Invalid users' });
  }

  users[user1].chatList = users[user1].chatList.filter((u) => u !== user2);
  users[user2].chatList = users[user2].chatList.filter((u) => u !== user1);

  if (users[user1].messages) delete users[user1].messages[user2];
  if (users[user2].messages) delete users[user2].messages[user1];

  saveUserData(users);

  io.emit(`chat-list-updated-${user1}`, users[user1].chatList);
  io.emit(`chat-list-updated-${user2}`, users[user2].chatList);

  return res.status(200).json({ message: 'Chat deleted successfully' });
});

// Start the Server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});