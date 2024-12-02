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

// File paths for persistent storage
const dataFilePath = path.join(__dirname, 'users.json');
const subscriptionFilePath = path.join(__dirname, 'subscriptions.json');

// Load user data from file
function loadUserData() {
  if (fs.existsSync(dataFilePath)) {
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
  }
  return {};
}

// Save user data to file
function saveUserData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// Load subscriptions from file
function loadSubscriptions() {
  if (fs.existsSync(subscriptionFilePath)) {
    return JSON.parse(fs.readFileSync(subscriptionFilePath, 'utf-8'));
  }
  return {};
}

// Save subscriptions to file
function saveSubscriptions(data) {
  fs.writeFileSync(subscriptionFilePath, JSON.stringify(data, null, 2));
}

// Load initial data
let users = loadUserData();
let subscriptions = loadSubscriptions();

// Create HTTP and WebSocket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// VAPID Keys for Push Notifications
const publicVapidKey = 'BEgrq4Ls6ZiFuDQErAqEK0UAG0ZyfZxUykXiAHjM42Cwk2yIdcIOwkt0jSnp13QVdg9Nh7N36b_ob9WJNTeggFY'; // Replace with your public key
const privateVapidKey = 'djkDv8YzWr8eibSAaPXAe-pz6JV07nQs8-3wQbGKO6M'; // Replace with your private key

webPush.setVapidDetails(
  'mailto:sm1555524@gmail.com', // Replace with your email
  publicVapidKey,
  privateVapidKey
);

// Send a push notification
const sendNotification = (username, payload) => {
  const subscription = subscriptions[username];
  if (subscription) {
    webPush
      .sendNotification(
        subscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: '/chat192.png', // Ensure this icon path is valid
          tag: 'message-notification', // Group notifications under this tag
          renotify: true, // Notify even if a notification with the same tag exists
          requireInteraction: true, // Keeps the notification on the screen until dismissed
          data: payload.data || {}, // Attach data for handling clicks
        })
      )
      .catch((error) => {
        console.error(`Error sending notification to ${username}:`, error);
        if (error.statusCode === 410) { // Subscription is no longer valid
          console.log(`Deleting subscription for ${username}`);
          delete subscriptions[username];
          saveSubscriptions(subscriptions);
        }
      });
  }
};

// API Endpoints

// Save subscription
app.post('/subscribe', (req, res) => {
  const { username, subscription } = req.body;

  if (!username || !subscription) {
    return res.status(400).json({ message: 'Username and subscription are required' });
  }

  subscriptions[username] = subscription;
  saveSubscriptions(subscriptions);
  res.status(201).json({ message: 'Subscription saved' });
});

// Register user
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (users[username]) {
    return res.status(400).json({ message: 'Username is already taken' });
  }

  users[username] = { password, chatList: [], messages: {} };
  saveUserData(users);
  return res.status(201).json({ message: 'User registered successfully' });
});

// Login user
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

// Validate username
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

// Update chat list
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

// Fetch messages
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

// Delete chat
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

// WebSocket communication
io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('send-message', ({ from, to, message }) => {
    if (users[from] && users[to]) {
      const msg = { sender: from, text: message, timestamp: new Date().toISOString() };
      
      if (!users[from].messages) users[from].messages = {};
      if (!users[to].messages) users[to].messages = {};

      if (!users[from].messages[to]) users[from].messages[to] = [];
      if (!users[to].messages[from]) users[to].messages[from] = [];

      users[from].messages[to].push(msg);
      users[to].messages[from].push(msg);

      saveUserData(users);

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

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});