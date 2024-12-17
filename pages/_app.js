import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((err) => console.error('Service Worker registration failed:', err));
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
