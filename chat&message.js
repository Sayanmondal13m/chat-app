const subscribeToNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'YOUR_PUBLIC_KEY', // Replace with your public VAPID key
      });
  
      // Send subscription to the server
      await fetch('https://rust-mammoth-route.glitch.me/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: localStorage.getItem('username'),
          subscription,
        }),
      });
  
      console.log('Subscribed to notifications');
    } else {
      console.error('Push notifications are not supported in this browser');
    }
  };
  
  // Call the function on page load
  useEffect(() => {
    subscribeToNotifications();
  }, []);
  