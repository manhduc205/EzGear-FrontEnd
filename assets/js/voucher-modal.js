/**
 * Voucher Modal System
 * Hệ thống quản lý voucher modal cho EzGear E-commerce
 */

class VoucherModal {
    constructor(options = {}) {
        this.modalId = options.modalId || 'voucherModal';
        this.inputId = options.inputId || 'voucherInput';
        this.onApply = options.onApply || null;
        this.cartData = options.cartData || { totalPrice: 0, items: [] };
        
        this.vouchers = [];
        this.filteredVouchers = [];
        this.currentCategory = 'all';
        
        this.init();
    }
    
    init() {
        this.createModal();
        this.bindEvents();
    }
    
    createModal() {
        // Kiểm tra nếu modal đã tồn tại
        if (document.getElementById(this.modalId)) {
            return;
        }
        
        const modalHTML = `
            <div id="${this.modalId}" class="voucher-modal">
                <div class="voucher-modal-content">
                    <div class="voucher-modal-header">
                        <h3>
                            <i class="fas fa-ticket-alt"></i>
                            Chọn Voucher
                        </h3>
                        <button class="voucher-close-btn" onclick="window.voucherModal.close()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="voucher-modal-body">
                        <!-- Search Box -->
                        <div class="voucher-search">
                            <i class="fas fa-search"></i>
                            <input type="text" placeholder="Tìm kiếm voucher..." onkeyup="window.voucherModal.searchVouchers(this.value)">
                        </div>
                        
                        <!-- Categories -->
                        <div class="voucher-categories">
                            <button class="category-btn active" onclick="window.voucherModal.filterByCategory('all')">Tất Cả</button>
                            <button class="category-btn" onclick="window.voucherModal.filterByCategory('AMOUNT')">Giảm Tiền</button>
                            <button class="category-btn" onclick="window.voucherModal.filterByCategory('PERCENT')">Giảm %</button>
                            <button class="category-btn" onclick="window.voucherModal.filterByCategory('SHIPPING')">Miễn Ship</button>
                        </div>
                        
                        <!-- Voucher List -->
                        <div class="voucher-list" id="voucherList">
                            <div class="voucher-loading">
                                <i class="fas fa-spinner fa-spin"></i>
                                Đang tải voucher...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    bindEvents() {
        // Đóng modal khi click outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById(this.modalId);
            if (e.target === modal) {
                this.close();
            }
        });
        
        // Đóng modal khi nhấn ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }
    
    async open() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Load vouchers nếu chưa có
            if (this.vouchers.length === 0) {
                await this.loadVouchers();
            } else {
                this.renderVoucherList(this.vouchers);
            }
        }
    }
    
    close() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    async loadVouchers() {
        try {
            const voucherListEl = document.getElementById('voucherList');
            voucherListEl.innerHTML = `
                <div class="voucher-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Đang tải voucher...
                </div>
            `;
            
            // Gọi API thực để lấy danh sách voucher
            const BASE_URL = window.API_BASE_URL || 'http://localhost:8080';
            const response = await fetch(`${BASE_URL}/api/voucher/available`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.vouchers = data.payload || [];
                this.renderVoucherList(this.vouchers);
            } else {
                this.showError(data.message || 'Không thể tải danh sách voucher');
            }
        } catch (error) {
            console.error('Error loading vouchers:', error);
            this.showError('Lỗi kết nối API. Vui lòng thử lại sau.');
        }
    }

    
    renderVoucherList(vouchers) {
        const voucherListEl = document.getElementById('voucherList');
        
        if (!vouchers || vouchers.length === 0) {
            voucherListEl.innerHTML = `
                <div class="voucher-empty">
                    <i class="fas fa-ticket-alt"></i>
                    <h4>Không có voucher nào</h4>
                    <p>Hiện tại chưa có voucher phù hợp</p>
                </div>
            `;
            return;
        }
        
        // Phân loại và sắp xếp voucher
        const processedVouchers = this.processVouchers(vouchers);
        
        let html = '';
        processedVouchers.forEach(voucher => {
            html += this.renderVoucherCard(voucher);
        });
        
        voucherListEl.innerHTML = html;
    }
    
    processVouchers(vouchers) {
        const processed = vouchers.map(voucher => {
            const eligibility = this.checkVoucherEligibility(voucher);
            return {
                ...voucher,
                eligible: eligibility.eligible,
                reason: eligibility.reason
            };
        });
        
        // Sắp xếp: voucher hợp lệ lên đầu
        return processed.sort((a, b) => {
            if (a.eligible && !b.eligible) return -1;
            if (!a.eligible && b.eligible) return 1;
            return 0;
        });
    }
    
    checkVoucherEligibility(voucher) {
        const cartTotal = this.cartData.totalPrice || 0;
        const cartItems = this.cartData.items || [];
        
        console.log(`🎫 Checking voucher ${voucher.code}:`, {
            cartTotal: cartTotal,
            minOrder: voucher.minOrder,
            cartItemsCount: cartItems.length,
            voucher: voucher
        });
        
        // Kiểm tra đơn tối thiểu
        if (voucher.minOrder && cartTotal < voucher.minOrder) {
            console.log(`❌ ${voucher.code}: Insufficient order amount - ${cartTotal} < ${voucher.minOrder}`);
            return {
                eligible: false,
                reason: `Chưa đủ đơn tối thiểu ${this.formatCurrency(voucher.minOrder)}`
            };
        }
        
        // Kiểm tra scope category
        if (voucher.scope === 'CATEGORY' && voucher.applicableCategoryIds) {
            const hasApplicableItem = cartItems.some(item => 
                voucher.applicableCategoryIds.includes(item.categoryId)
            );
            
            if (!hasApplicableItem) {
                console.log(`❌ ${voucher.code}: No applicable category items`);
                return {
                    eligible: false,
                    reason: 'Không có sản phẩm phù hợp trong giỏ hàng'
                };
            }
        }
        
        // Kiểm tra hạn sử dụng
        const now = new Date();
        const endDate = new Date(voucher.endAt);
        
        if (now > endDate) {
            console.log(`❌ ${voucher.code}: Expired`);
            return {
                eligible: false,
                reason: 'Voucher đã hết hạn'
            };
        }
        
        console.log(`✅ ${voucher.code}: Eligible!`);
        return { eligible: true, reason: null };
    }
    
    renderVoucherCard(voucher) {
        const discountText = this.getDiscountText(voucher);
        const conditionsText = this.getConditionsText(voucher);
        const expiryText = this.getExpiryText(voucher);
        
        const cardClass = voucher.eligible ? 'voucher-card eligible' : 'voucher-card disabled';
        const leftClass = this.getLeftClass(voucher);
        
        const actionButton = voucher.eligible 
            ? `<button class="btn-apply-voucher" onclick="window.voucherModal.applyVoucher('${voucher.code}')">
                 Áp Dụng
               </button>`
            : `<button class="btn-apply-voucher" disabled>
                 Không thể sử dụng
               </button>`;
        
        const errorMessage = !voucher.eligible 
            ? `<div class="voucher-error">
                 <i class="fas fa-exclamation-triangle"></i>
                 ${voucher.reason}
               </div>`
            : '';
        
        return `
            <div class="${cardClass}">
                <div class="voucher-left ${leftClass}">
                    <div class="voucher-discount">${discountText.value}</div>
                    <div class="voucher-type">${discountText.type}</div>
                </div>
                <div class="voucher-right">
                    <div class="voucher-info">
                        <h4>${voucher.code}</h4>
                        <div class="voucher-conditions">${conditionsText}</div>
                        <div class="voucher-expiry">
                            <i class="fas fa-clock"></i>
                            ${expiryText}
                        </div>
                    </div>
                    <div class="voucher-actions">
                        ${actionButton}
                    </div>
                    ${errorMessage}
                </div>
            </div>
        `;
    }
    
    getDiscountText(voucher) {
        if (voucher.discountType === 'PERCENT') {
            return {
                value: `${voucher.discountValue}%`,
                type: 'Giảm phần trăm'
            };
        } else {
            return {
                value: this.formatCurrency(voucher.discountValue),
                type: voucher.type === 'SHIPPING' ? 'Miễn phí ship' : 'Giảm tiền'
            };
        }
    }
    
    getConditionsText(voucher) {
        let conditions = [];
        
        if (voucher.minOrder > 0) {
            conditions.push(`Đơn tối thiểu ${this.formatCurrency(voucher.minOrder)}`);
        }
        
        if (voucher.maxDiscount) {
            conditions.push(`Giảm tối đa ${this.formatCurrency(voucher.maxDiscount)}`);
        }
        
        if (voucher.scope === 'CATEGORY') {
            conditions.push('Áp dụng cho danh mục cụ thể');
        } else {
            conditions.push('Áp dụng toàn sàn');
        }
        
        return conditions.join(' • ');
    }
    
    getExpiryText(voucher) {
        const endDate = new Date(voucher.endAt);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) {
            return 'Đã hết hạn';
        } else if (diffDays <= 7) {
            return `Còn ${diffDays} ngày`;
        } else {
            return `HSD: ${endDate.toLocaleDateString('vi-VN')}`;
        }
    }
    
    getLeftClass(voucher) {
        if (voucher.type === 'SHIPPING') return 'shipping';
        if (voucher.discountType === 'PERCENT') return 'percent';
        return '';
    }
    
    searchVouchers(query) {
        if (!query.trim()) {
            this.renderVoucherList(this.vouchers);
            return;
        }
        
        const filtered = this.vouchers.filter(voucher => 
            voucher.code.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderVoucherList(filtered);
    }
    
    filterByCategory(category) {
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.currentCategory = category;
        
        let filtered = this.vouchers;
        
        if (category !== 'all') {
            filtered = this.vouchers.filter(voucher => {
                if (category === 'SHIPPING') {
                    return voucher.type === 'SHIPPING';
                }
                return voucher.discountType === category;
            });
        }
        
        this.renderVoucherList(filtered);
    }
    
    applyVoucher(code) {
        const input = document.getElementById(this.inputId);
        if (input) {
            input.value = code;
            
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        }
        
        // Gọi callback nếu có
        if (this.onApply) {
            this.onApply(code);
        }
        
        // Đóng modal
        this.close();
        
        // Hiển thị thông báo
        this.showSuccess(`Đã áp dụng voucher ${code}`);
    }
    
    updateCartData(cartData) {
        console.log('🔄 Voucher modal updating cart data:', cartData);
        this.cartData = cartData;
        
        // Re-render nếu modal đang mở
        const modal = document.getElementById(this.modalId);
        if (modal && modal.classList.contains('active')) {
            console.log('🔄 Modal is open, re-rendering voucher list...');
            this.renderVoucherList(this.vouchers);
        }
    }
    
    showSuccess(message) {
        // Tạo toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
        `;
        toast.innerHTML = `
            <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    showError(message) {
        const voucherListEl = document.getElementById('voucherList');
        voucherListEl.innerHTML = `
            <div class="voucher-empty">
                <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                <h4>Lỗi</h4>
                <p>${message}</p>
            </div>
        `;
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

// Global instance
let voucherModal = null;

// Initialize function
function initVoucherModal(options) {
    if (!window.voucherModal) {
        window.voucherModal = new VoucherModal(options);
    }
    return window.voucherModal;
}

// Helper function to create voucher select button
function createVoucherSelectButton(containerId, inputId, placeholder = "Chọn hoặc nhập mã voucher") {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const buttonHTML = `
        <button class="voucher-select-btn" onclick="window.voucherModal.open()">
            <i class="fas fa-ticket-alt"></i>
            <span class="btn-text">${placeholder}</span>
            <i class="fas fa-chevron-right arrow"></i>
        </button>
        <input type="text" id="${inputId}" placeholder="Hoặc nhập mã voucher" 
               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-top: 8px;">
    `;
    
    container.innerHTML = buttonHTML;
}