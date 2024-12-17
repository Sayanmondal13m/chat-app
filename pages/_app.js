import { useEffect } from "react";
import "@/styles/globals.css";
import { requestNotificationPermission } from "../utils/firebaseConfig";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Register the service worker and request permission on the client side
    if (typeof window !== "undefined") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/firebase-messaging-sw.js")
          .then((registration) => {
            console.log("Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });
      }

      // Request notification permission
      requestNotificationPermission();
    }
  }, []);

  return <Component {...pageProps} />;
}