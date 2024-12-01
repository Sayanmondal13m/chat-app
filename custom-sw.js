// Import Workbox libraries
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

// Automatically injected by Workbox
precacheAndRoute(self.__WB_MANIFEST);

// Claim clients immediately after the service worker becomes active
clientsClaim();

// Listen for push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  // Show notification
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/chat192.png', // Ensure this icon is in the public folder
    tag: data.tag || 'default-tag', // Ensures notifications are grouped
    data: data.data || {}, // Attach additional data (like URLs) to the notification
    actions: [
      { action: 'reply', title: 'Reply' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification when clicked

  // Open the URL specified in the notification's data
  const clickActionUrl = event.notification.data.url || '/';
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

// Handle notification action buttons
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'reply') {
    console.log('User clicked reply');
    // Handle reply action (optional)
  } else if (event.action === 'dismiss') {
    console.log('User clicked dismiss');
    // Handle dismiss action (optional)
  } else {
    // Default action
    console.log('Notification clicked');
  }
});