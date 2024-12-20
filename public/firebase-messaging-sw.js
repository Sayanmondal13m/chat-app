importScripts("https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/9.20.0/firebase-messaging.js");

const firebaseConfig = {
  apiKey: "AIzaSyBSFi6V7i0x3Z552tkEjlnvM_YnIYPt2XI",
  authDomain: "notify-c1d79.firebaseapp.com",
  projectId: "notify-c1d79",
  storageBucket: "notify-c1d79.firebasestorage.app",
  messagingSenderId: "597808379271",
  appId: "1:597808379271:web:08d1b3771099995a894f22",
  measurementId: "G-6D08QVY6MM"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message: ", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/chat192.png", // Replace with your app's icon if available
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});