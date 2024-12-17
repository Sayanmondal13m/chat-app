// Import Firebase functions from the modular SDK
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

// Firebase configuration (replace with your Firebase Console config)
const firebaseConfig = {
  apiKey: "AIzaSyBSFi6V7i0x3Z552tkEjlnvM_YnIYPt2XI",
  authDomain: "notify-c1d79.firebaseapp.com",
  projectId: "notify-c1d79",
  storageBucket: "notify-c1d79.firebasestorage.app",
  messagingSenderId: "597808379271",
  appId: "1:597808379271:web:08d1b3771099995a894f22",
  measurementId: "G-6D08QVY6MM"
};

// Initialize Firebase App (ensure only one instance exists)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize messaging only in the browser (client-side)
let messaging;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  messaging = getMessaging(app);
}

// Function to request notification permission and retrieve the FCM token
export const requestNotificationPermission = async () => {
  if (!messaging) return;

  try {
    const token = await getToken(messaging, {
      vapidKey: "BIe18oP8ygurv-7Pc6lXEjZDcIcsF4tadnBVQONKvai93b-HRiaS_NCPJr7L", // Replace with your Public VAPID Key
    });
    console.log("FCM Token:", token);

    // Send the token to the backend to save it
    await fetch("https://rust-mammoth-route.glitch.me/save-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: localStorage.getItem("username"),
        token: token,
      }),
    });
  } catch (error) {
    console.error("Error getting FCM token or permission:", error);
  }
};

export default app;