self.addEventListener('push', (event) => {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.png', // Add your app's icon here
    });
  });
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          // Focus on an open tab
          return clientList[0].focus();
        } else {
          // Open a new tab
          return clients.openWindow('/chat');
        }
      })
    );
  });
  