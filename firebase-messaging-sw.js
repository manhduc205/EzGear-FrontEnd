importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Cấu hình Firebase (Phải khớp với config.js nhưng SW chạy độc lập nên cần khai báo lại)
firebase.initializeApp({
    apiKey: "AIzaSyBfG7WTsf9EyoZ09skrvPsELtbW3RxNjf8",
    authDomain: "ezgear.firebaseapp.com",
    projectId: "ezgear",
    storageBucket: "ezgear.firebasestorage.app",
    messagingSenderId: "853056724838",
    appId: "1:853056724838:web:180d4ae48b495bb423b2a7"
});

const messaging = firebase.messaging();

// 1. Xử lý tin nhắn khi chạy nền (Background)
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Nhận tin nền:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/assets/img/logo.png', // Đảm bảo đường dẫn icon đúng
        data: payload.data, // Chứa orderId, type...
        tag: 'new-order-notification', // Gom nhóm thông báo
        renotify: true
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 2. Xử lý sự kiện click vào thông báo
self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Click vào thông báo:', event.notification.data);
    event.notification.close();

    const data = event.notification.data;
    let urlToOpen = '/modules/admin/dashboard.html'; // Mặc định

    // Điều hướng dựa trên loại thông báo
    if (data && data.orderId) {
        // Đường dẫn đến chi tiết đơn hàng admin
        // Lưu ý: Cần đường dẫn tuyệt đối hoặc tương đối chính xác từ root server
        urlToOpen = `/modules/admin/purchase-orders/purchase-orders.html?id=${data.orderId}`;
    }

    // Logic mở tab: Nếu tab đã mở thì focus, chưa thì mở mới
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Kiểm tra xem có tab nào đang mở URL này không
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // So sánh tương đối URL
                if (client.url.includes('purchase-orders.html') && 'focus' in client) {
                    // Nếu đang ở trang list, có thể cần navigate tới detail
                    if (data.orderId) {
                        client.navigate(urlToOpen);
                    }
                    return client.focus();
                }
            }
            // Nếu không tìm thấy tab phù hợp, mở tab mới
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
