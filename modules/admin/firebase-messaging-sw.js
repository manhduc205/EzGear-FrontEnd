// Import script Firebase dành cho Service Worker (dùng importScripts cũ vì SW chạy môi trường riêng)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Config lại lần nữa (Vì SW chạy luồng riêng, nó không đọc được file config kia)
firebase.initializeApp({
    apiKey: "AIzaSyD...",           // <--- COPY Y HỆT CONFIG VÀO ĐÂY
    authDomain: "ezgear-xyz.firebaseapp.com",
    projectId: "ezgear-xyz",
    storageBucket: "ezgear-xyz.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456:web:..."
});

const messaging = firebase.messaging();

// Xử lý sự kiện nhận tin khi chạy nền (Background)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Đã nhận tin nền: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/path/to/icon.png', // Đường dẫn icon logo web bạn
    data: payload.data // Lưu data để xử lý click
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Xử lý sự kiện click vào thông báo
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // Logic mở tab mới hoặc focus vào tab cũ (Đơn giản là mở trang admin)
    event.waitUntil(
        clients.openWindow("http://localhost:5500/admin-orders.html") // Sửa port và đường dẫn cho đúng
    );
});