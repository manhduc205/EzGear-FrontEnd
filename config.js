const firebaseConfig = {
  apiKey: "AIzaSyBfG7WTsf9EyoZ09skrvPsELtbW3RxNjf8",
  authDomain: "ezgear.firebaseapp.com",
  projectId: "ezgear",
  storageBucket: "ezgear.firebasestorage.app",
  messagingSenderId: "853056724838",
  appId: "1:853056724838:web:180d4ae48b495bb423b2a7",
  measurementId: "G-0TDPS0FZ2E"
};
// Vapid Key (Key công khai để browser nhận thông báo)
export const VAPID_KEY = "BA3pJMZ8le5pyh8Ww12de3Y4IUgpXvJOl1SVppdx_ykS3tv8DtdTxFdM8UYd-cK3E73wZ7DYr22lFp9awYBw594"; // <--- Paste key dài ngoằng vào đây

// Đường dẫn API Backend
export const API_SUBSCRIBE_URL = "http://localhost:8080/api/notifications/subscribe";