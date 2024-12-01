// Import Workbox libraries
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

// Automatically injected by Workbox
precacheAndRoute(self.__WB_MANIFEST);

// Your custom push notification logic
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: './public/chat192.png', // Replace with the path to your icon
    actions: [
      { action: 'reply', title: 'Reply' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
});