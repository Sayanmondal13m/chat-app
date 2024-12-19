import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyBSFi6V7i0x3Z552tkEjlnvM_YnIYPt2XI",
    authDomain: "notify-c1d79.firebaseapp.com",
    projectId: "notify-c1d79",
    storageBucket: "notify-c1d79.firebasestorage.app",
    messagingSenderId: "597808379271",
    appId: "1:597808379271:web:08d1b3771099995a894f22",
    measurementId: "G-6D08QVY6MM",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "BLl7zbH3n9x_nsocEahogb5hVwddYgUlI8ZnwIJWb764_fF9rLd1Y_ZDBKA-NLUU46AUJfzbr1tooPXoA2GafGY",
    });
    return token;
  } catch (error) {
    console.error("Error fetching notification token: ", error);
    return null;
  }
};

export const onForegroundMessage = (callback) => {
  onMessage(messaging, callback);
};

export default app;
