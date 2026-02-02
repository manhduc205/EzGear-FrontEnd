// ==================== FIREBASE SERVICE WORKER FOR ADMIN ====================
// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ⚠️ Firebase config (PHẢI KHỚP với config.js)
// Service Worker chạy độc lập nên cần khai báo lại
firebase.initializeApp({
    apiKey: "AIzaSyBfG7WTsf9EyoZ09skrvPsELtbW3RxNjf8",
    authDomain: "ezgear.firebaseapp.com",
    projectId: "ezgear",
    storageBucket: "ezgear.firebasestorage.app",
    messagingSenderId: "853056724838",
    appId: "1:853056724838:web:180d4ae48b495bb423b2a7"
});

const messaging = firebase.messaging();

// Xử lý tin nhắn nền (Background)
messaging.onBackgroundMessage((payload) => {
    console.log('[Admin SW] Nhận thông báo nền:', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/assets/img/logo.png',
        data: payload.data,
        tag: 'admin-notification',
        requireInteraction: true  // Giữ thông báo cho đến khi click
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Xử lý click vào thông báo
self.addEventListener('notificationclick', function(event) {
    console.log('[Admin SW] Click thông báo:', event.notification.data);
    event.notification.close();
    
    const data = event.notification.data;
    // Xây dựng URL tương đối (hoạt động trên mọi domain)
    let urlToOpen = '/modules/admin/dashboard.html';
    
    if (data && data.orderId) {
        urlToOpen = `/modules/admin/purchase-orders/purchase-orders.html?id=${data.orderId}`;
    }
    
    // Mở hoặc focus vào tab
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                // Tìm tab đã mở
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes('purchase-orders.html') && 'focus' in client) {
                        if (data.orderId) {
                            client.navigate(urlToOpen);
                        }
                        return client.focus();
                    }
                }
                // Mở tab mới
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});