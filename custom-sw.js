// Import Workbox libraries
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

// Precache files injected by Workbox
precacheAndRoute(self.__WB_MANIFEST);

// Claim clients immediately after the service worker becomes active
clientsClaim();

// Listen for push events and show notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('Push event received with no data.');
    return;
  }

  const data = event.data.json();
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'You have a new message.',
    icon: '/chat192.png', // Ensure this is in the `public/` folder
    badge: '/chat192.png', // Optional: Add a badge for smaller devices
    tag: data.tag || 'default-tag', // Tag ensures notifications are grouped
    renotify: true, // Show the notification again even if the same tag exists
    requireInteraction: true, // Keeps the notification visible until user interacts
    data: data.data || {}, // Additional data, such as URLs or IDs
    actions: [
      { action: 'reply', title: 'Reply' }, // Add more actions as needed
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification when clicked

  // Extract the URL or fallback to home page
  const clickActionUrl = event.notification.data.url || '/';

  // Open the URL in a new tab or focus an existing one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === clickActionUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickActionUrl);
      }
    })
  );
});

// Optional: Handle notification action buttons
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'reply') {
    console.log('User clicked Reply action');
    // Add logic to handle the reply action (if needed)
  } else if (event.action === 'dismiss') {
    console.log('User clicked Dismiss action');
    // Handle the dismiss action (optional)
  } else {
    console.log('Notification clicked without an action');
  }
});

// Handle push subscription expiration
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription expired');
  // Logic to resubscribe the user can go here
});