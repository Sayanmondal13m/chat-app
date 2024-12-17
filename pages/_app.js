import { useEffect } from "react";
import "@/styles/globals.css";

const VAPID_PUBLIC_KEY = "BBuxUzdZnNkaZZVMYvbKJ6lD59sdwD_hzkfVQKLQJXLpxEfrBTXYiaV-sp1Uawg25hiG7ckzqbPTb1JcMtBErDQ"; // Replace with your URL-safe VAPID Public Key

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const swUrl =
            process.env.NODE_ENV === "production"
              ? "/service-worker.js" // Production service worker
              : "/sw.js"; // Development fallback service worker

          const registration = await navigator.serviceWorker.register(swUrl);
          console.log("Service Worker registered:", registration);

          // Request Notification Permission
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            console.log("Notification permission granted.");

            // Subscribe to Push Notifications
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            console.log("Push Subscription:", subscription);

            // Send subscription to the backend
            await fetch("https://rust-mammoth-route.glitch.me/save-subscription", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                subscription,
                username: localStorage.getItem("username"), // Adjust based on your authentication logic
              }),
            });

            console.log("Subscription sent to server.");
          } else {
            console.warn("Notification permission denied.");
          }
        } catch (error) {
          console.error("Service Worker registration or Push Subscription failed:", error);
        }
      } else {
        console.warn("Service Worker is not supported in this browser.");
      }
    };

    registerServiceWorker();
  }, []);

  return <Component {...pageProps} />;
}
