import { useEffect } from 'react';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        },
        (err) => {
          console.error('Service Worker registration failed:', err);
        }
      );
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
