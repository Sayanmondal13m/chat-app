import { useEffect } from "react";
import "@/styles/globals.css";

const VAPID_PUBLIC_KEY = "BBuxUzdZnNkaZZVMYvbKJ6lD59sdwD_hzkfVQKLQJXLpxEfrBTXYiaV-sp1Uawg25hiG7ckzqbPTb1JcMtBErDQ";

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
          const registration = await navigator.serviceWorker.register("/service-worker.js");
          console.log("Service Worker registered:", registration);

          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            console.log("Notification permission granted.");

            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            console.log("Push Subscription:", subscription);

            await fetch("https://rust-mammoth-route.glitch.me/save-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subscription,
                username: localStorage.getItem("username"), // Adjust to your logic
              }),
            });

            console.log("Subscription saved to server.");
          } else {
            console.warn("Notification permission denied.");
          }
        } catch (error) {
          console.error("Service Worker registration or subscription failed:", error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  return <Component {...pageProps} />;
}
