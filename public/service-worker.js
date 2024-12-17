self.addEventListener("push", (event) => {
    const data = event.data.json();
    console.log("Push received:", data);
  
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.png", // Add your app's notification icon
    });
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        } else {
          return clients.openWindow("/chat"); // Adjust this to your desired notification click action
        }
      })
    );
  });
  