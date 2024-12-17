importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBSFi6V7i0x3Z552tkEjlnvM_YnIYPt2XI",
  authDomain: "notify-c1d79.firebaseapp.com",
  projectId: "notify-c1d79",
  storageBucket: "notify-c1d79.firebasestorage.app",
  messagingSenderId: "597808379271",
  appId: "1:597808379271:web:08d1b3771099995a894f22",
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage(function (payload) {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/chat512.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
