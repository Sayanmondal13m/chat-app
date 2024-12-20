import { useEffect } from "react";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Dynamically import Firebase Messaging on the client side
      import("../firebaseMessaging");
    }
  }, []);

  return <Component {...pageProps} />;
}