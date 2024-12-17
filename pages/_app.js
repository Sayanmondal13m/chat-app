import { useEffect } from "react";
import "@/styles/globals.css";

const VAPID_PUBLIC_KEY = "BBuxUzdZnNkaZZVMYvbKJ6lD59sdwD_hzkfVQKLQJXLpxEfrBTXYiaV-sp1Uawg25hiG7ckzqbPTb1JcMtBErDQ"; // Replace with your actual URL-safe public key

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);

          // Request notification permission
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              registration.pushManager
                .subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                })
                .then((subscription) => {
                  console.log("Push subscription:", subscription);

                  // Send the subscription to the backend
                  fetch("https://rust-mammoth-route.glitch.me/save-subscription", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      subscription,
                      username: localStorage.getItem("username"),
                    }),
                  });
                });
            }
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return <Component {...pageProps} />;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
