/* ==================== PAYMENT RESULT JS ==================== */

document.addEventListener('DOMContentLoaded', () => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const orderCode = urlParams.get('code');
    const vnpResponseCode = urlParams.get('vnp_ResponseCode'); // For VNPAY return

    // Determine final status
    // If VNPAY return, check vnp_ResponseCode (00 is success)
    let finalStatus = status;
    if (vnpResponseCode) {
        finalStatus = vnpResponseCode === '00' ? 'success' : 'failed';
    }

    renderResult(finalStatus, orderCode);
});

function renderResult(status, orderCode) {
    const loadingState = document.getElementById('loadingState');
    const resultContent = document.getElementById('resultContent');
    const iconWrapper = document.getElementById('iconWrapper');
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    const orderInfo = document.getElementById('orderInfo');
    const orderCodeEl = document.getElementById('orderCode');
    const primaryBtn = document.getElementById('primaryBtn');
    const secondaryBtn = document.getElementById('secondaryBtn');

    // Hide loading
    loadingState.style.display = 'none';
    resultContent.style.display = 'block';

    if (status === 'success') {
        // Success State
        iconWrapper.className = 'icon-wrapper icon-success';
        resultIcon.className = 'fas fa-check';
        resultTitle.textContent = 'Đặt Hàng Thành Công!';
        resultMessage.textContent = 'Cảm ơn bạn đã mua sắm tại EzGear. Đơn hàng của bạn đang được xử lý.';
        
        if (orderCode) {
            orderInfo.style.display = 'block';
            orderCodeEl.textContent = orderCode;
        }

        primaryBtn.textContent = 'Tiếp Tục Mua Sắm';
        primaryBtn.onclick = () => window.location.href = '../../index.html';
        
        secondaryBtn.textContent = 'Xem Đơn Hàng';
        secondaryBtn.onclick = () => window.location.href = `../order/order-detail.html?code=${orderCode}`;

        // Clear cart
        clearCart();

    } else {
        // Failed State
        iconWrapper.className = 'icon-wrapper icon-error';
        resultIcon.className = 'fas fa-times';
        resultTitle.textContent = 'Thanh Toán Thất Bại';
        resultMessage.textContent = 'Giao dịch thanh toán đã bị hủy hoặc xảy ra lỗi. Vui lòng thử lại.';
        
        if (orderCode) {
            orderInfo.style.display = 'block';
            orderCodeEl.textContent = orderCode;
        }

        primaryBtn.textContent = 'Thử Lại';
        primaryBtn.onclick = () => window.location.href = './checkout.html'; // Go back to checkout
        
        secondaryBtn.textContent = 'Về Trang Chủ';
        secondaryBtn.onclick = () => window.location.href = '../../index.html';
    }
}

function clearCart() {
    // Clear cart items from localStorage/sessionStorage
    localStorage.removeItem('cartItems'); // Assuming main cart is here
    sessionStorage.removeItem('checkoutItems'); // Checkout items
    sessionStorage.removeItem('checkoutVoucher'); // Voucher
    
    // Dispatch event to update cart count in header if needed
    window.dispatchEvent(new Event('cartUpdated'));
}
