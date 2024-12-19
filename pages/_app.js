import "@/styles/globals.css";
import { useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBSFi6V7i0x3Z552tkEjlnvM_YnIYPt2XI",
  authDomain: "notify-c1d79.firebaseapp.com",
  projectId: "notify-c1d79",
  storageBucket: "notify-c1d79.firebasestorage.app",
  messagingSenderId: "597808379271",
  appId: "1:597808379271:web:08d1b3771099995a894f22",
  measurementId: "G-6D08QVY6MM"
};

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    // Request notification permission
    Notification.requestPermission()
      .then((permission) => {
        if (permission === "granted") {
          console.log("Notification permission granted.");
          // Get the FCM registration token
          getToken(messaging, {
            vapidKey: "BLl7zbH3n9x_nsocEahogb5hVwddYgUlI8ZnwIJWb764_fF9rLd1Y_ZDBKA-NLUU46AUJfzbr1tooPXoA2GafGY", // Add your VAPID key here
          })
            .then((currentToken) => {
              if (currentToken) {
                console.log("FCM Registration Token:", currentToken);
                // Copy this token and use it in Firebase campaigns
              } else {
                console.log("No registration token available.");
              }
            })
            .catch((err) => {
              console.error("An error occurred while retrieving the token.", err);
            });
        } else {
          console.log("Notification permission denied.");
        }
      })
      .catch((err) => {
        console.error("Permission request failed.", err);
      });

      // Handle messages received while the app is in the foreground
    onMessage(messaging, (payload) => {
      console.log("Message received in foreground:", payload);
    });

    // Register the service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    }
  }, []);

  return <Component {...pageProps} />;
}
