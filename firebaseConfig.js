import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";
import { VAPID_KEY, API_SUBSCRIBE_URL } from './config.js'; // Import từ config gốc

// Cấu hình Firebase (Khớp với config.js)
const firebaseConfig = {
    apiKey: "AIzaSyBfG7WTsf9EyoZ09skrvPsELtbW3RxNjf8",
    authDomain: "ezgear.firebaseapp.com",
    projectId: "ezgear",
    storageBucket: "ezgear.firebasestorage.app",
    messagingSenderId: "853056724838",
    appId: "1:853056724838:web:180d4ae48b495bb423b2a7",
    measurementId: "G-0TDPS0FZ2E"
};

// Khởi tạo Firebase
let app;
let messaging;

try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log("🔥 Firebase initialized successfully");
} catch (error) {
    console.error("🔥 Firebase initialization failed:", error);
}

/**
 * Khởi tạo và đăng ký nhận thông báo
 */
export async function setupNotification() {
    if (!('serviceWorker' in navigator)) {
        console.warn("⚠️ Trình duyệt không hỗ trợ Service Worker");
        return;
    }

    try {
        // 1. Đăng ký Service Worker (File nằm ở root để có scope rộng nhất)
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log("✅ Service Worker registered with scope:", registration.scope);

        // 2. Xin quyền thông báo
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
            console.log("🔔 Quyền thông báo: Đã cấp");

            // 3. Lấy FCM Token
            const currentToken = await getToken(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
            });

            if (currentToken) {
                console.log("🔑 FCM Token:", currentToken);
                // 4. Gửi Token xuống Backend
                await sendTokenToBackend(currentToken);
            } else {
                console.log("⚠️ Không lấy được Token. Cần cấp quyền lại hoặc kiểm tra VAPID Key.");
            }
        } else {
            console.log("🚫 Quyền thông báo: Bị từ chối");
        }
    } catch (error) {
        console.error("❌ Lỗi setup notification:", error);
    }
}

/**
 * Gửi Token xuống Backend để subscribe vào topic
 * @param {string} token 
 */
async function sendTokenToBackend(token) {
    try {
        // Lấy Access Token nếu cần xác thực admin
        const accessToken = localStorage.getItem('accessToken');
        
        const response = await fetch(API_SUBSCRIBE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain", // Backend nhận String raw
                "Authorization": accessToken ? `Bearer ${accessToken}` : ""
            },
            body: token
        });

        if (response.ok) {
            console.log("🚀 Đã đăng ký nhận thông báo thành công!");
        } else {
            console.error("❌ Lỗi đăng ký với Backend:", response.status);
        }
    } catch (error) {
        console.error("❌ Lỗi kết nối Backend:", error);
    }
}

/**
 * Lắng nghe thông báo khi đang mở Web (Foreground)
 */
export function listenForMessages() {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
        console.log("📩 Có thông báo mới (Foreground):", payload);
        
        const { title, body } = payload.notification;
        const data = payload.data;

        // 1. Hiển thị Toast
        showBootstrapToast(title, body, data);
        
        // 2. Phát âm thanh
        playNotificationSound();

        // 3. Cập nhật Badge (nếu có UI)
        updateNotificationBadge();
    });
}

/**
 * Hiển thị Toast Bootstrap
 */
function showBootstrapToast(title, msg, data) {
    // ID duy nhất cho toast để tránh trùng lặp DOM
    const toastId = 'toast-' + Date.now();
    
    // Link điều hướng khi click vào toast
    let actionUrl = '#';
    if (data && data.orderId) {
        actionUrl = `/modules/admin/purchase-orders/purchase-orders.html?id=${data.orderId}`;
    }

    const toastHTML = `
    <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
        <div class="toast-header bg-primary text-white">
            <i class="fas fa-bell me-2"></i>
            <strong class="me-auto">${title}</strong>
            <small>Vừa xong</small>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body" style="cursor: pointer;" onclick="window.location.href='${actionUrl}'">
            ${msg}
        </div>
    </div>`;

    // Tìm hoặc tạo container
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
    }

    // Thêm toast vào container
    container.insertAdjacentHTML('beforeend', toastHTML);

    // Init Bootstrap Toast
    const toastElement = document.getElementById(toastId);
    if (window.bootstrap) {
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        // Xóa DOM sau khi ẩn để nhẹ trang
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

/**
 * Phát âm thanh thông báo
 */
function playNotificationSound() {
    // Dùng âm thanh nhẹ nhàng
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("🔇 Trình duyệt chặn tự phát âm thanh (cần tương tác user trước)"));
}

/**
 * Cập nhật số lượng thông báo (Demo)
 */
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        let count = parseInt(badge.innerText) || 0;
        badge.innerText = count + 1;
        badge.style.display = 'inline-block';
        
        // Hiệu ứng rung chuông
        const bellIcon = document.querySelector('.fa-bell');
        if (bellIcon) {
            bellIcon.classList.add('fa-shake');
            setTimeout(() => bellIcon.classList.remove('fa-shake'), 1000);
        }
    }
}
