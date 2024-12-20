import { getMessaging, onMessage, getToken } from "firebase/messaging";
import app from "./firebaseConfig";

const messaging = getMessaging(app);

// Register the service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("Service Worker registered:", registration);

      // Get the FCM token
      getToken(messaging, {
        vapidKey: "BLl7zbH3n9x_nsocEahogb5hVwddYgUlI8ZnwIJWb764_fF9rLd1Y_ZDBKA-NLUU46AUJfzbr1tooPXoA2GafGY",
        serviceWorkerRegistration: registration,
      })
        .then((currentToken) => {
          if (currentToken) {
            console.log("FCM Token:", currentToken);
            // Save this token to your server
          } else {
            console.log("No registration token available. Request permission to generate one.");
          }
        })
        .catch((err) => {
          console.error("An error occurred while retrieving token. ", err);
        });
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
}

// Handle foreground messages
onMessage(messaging, (payload) => {
  console.log("Message received in foreground:", payload);

  // Show notification in the browser
  if (Notification.permission === "granted") {
    new Notification(payload.notification.title, {
      body: payload.notification.body,
    });
  }
});

export default messaging;