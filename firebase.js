import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyBSFi6V7i0x3Z552tkEjlnvM_YnIYPt2XI",
    authDomain: "notify-c1d79.firebaseapp.com",
    projectId: "notify-c1d79",
    storageBucket: "notify-c1d79.firebasestorage.app",
    messagingSenderId: "597808379271",
    appId: "1:597808379271:web:08d1b3771099995a894f22",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Function to request notification permission
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging);
      console.log('FCM Token:', token);
      return token;
    } else {
      console.error('Permission denied for notifications');
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
};

export const onForegroundMessage = (callback) => {
  onMessage(messaging, callback);
};

export default messaging;
