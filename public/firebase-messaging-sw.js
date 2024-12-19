import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

const firebaseConfig = {
    apiKey: "AIzaSyBSFi6V7i0x3Z552tkEjlnvM_YnIYPt2XI",
    authDomain: "notify-c1d79.firebaseapp.com",
    projectId: "notify-c1d79",
    storageBucket: "notify-c1d79.firebasestorage.app",
    messagingSenderId: "597808379271",
    appId: "1:597808379271:web:08d1b3771099995a894f22",
    measurementId: "G-6D08QVY6MM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log("Received background message:", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
