tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          primary: "#D70018", // Reddish color from the buy buttons
          secondary: "#E04040",
          "background-light": "#F9FAFB",
          "background-dark": "#111827",
          "surface-light": "#FFFFFF",
          "surface-dark": "#1F2937",
          "text-light": "#1F2937",
          "text-dark": "#F3F4F6",
          "border-light": "#E5E7EB",
          "border-dark": "#374151",
          "accent-blue": "#2563EB",
        },
        fontFamily: {
          display: ["Inter", "sans-serif"],
          sans: ["Inter", "sans-serif"],
        },
        borderRadius: {
          DEFAULT: "0.5rem",
          lg: "0.75rem",
          xl: "1rem",
        },
        boxShadow: {
          'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        }
      },
    },
  };

// --- LOGIC TƯƠNG TÁC GIAO DIỆN (STATIC) ---

document.addEventListener('DOMContentLoaded', () => {
    setupGallery();
    setupVariants();
    setupActions();
    setupAddressSelector();
});

// 1. Xử lý Gallery ảnh
function setupGallery() {
    // Tìm ảnh chính (trong container aspect ratio 4/3)
    const mainImage = document.querySelector('.aspect-\\[4\\/3\\] > img');
    
    // Tìm các nút thumbnail (trong container có scrollbar)
    // Selector này dựa trên cấu trúc HTML hiện tại
    const galleryContainer = document.querySelector('.overflow-x-auto.custom-scrollbar');
    if (!galleryContainer) return;

    const galleryButtons = galleryContainer.querySelectorAll('button');

    galleryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Lấy ảnh trong nút được click
            const img = btn.querySelector('img');
            
            // Nếu nút là nút "Video" hoặc "Tính năng" (không có thẻ img trực tiếp làm src chính), ta có thể bỏ qua hoặc xử lý riêng
            // Ở đây ta chỉ xử lý các nút có ảnh sản phẩm
            if (img && mainImage) {
                // Hiệu ứng chuyển ảnh mượt
                mainImage.style.opacity = '0.5';
                setTimeout(() => {
                    mainImage.src = img.src;
                    mainImage.style.opacity = '1';
                }, 150);
                
                // Highlight thumbnail được chọn
                galleryButtons.forEach(b => {
                    b.classList.remove('border-primary', 'ring-2', 'ring-primary');
                    b.classList.add('border-gray-200', 'dark:border-gray-700');
                });
                btn.classList.remove('border-gray-200', 'dark:border-gray-700');
                btn.classList.add('border-primary', 'ring-1', 'ring-primary');
            }
        });
    });
}

// 2. Xử lý chọn Phiên bản (Dung lượng)
function setupVariants() {
    // Tìm container chứa các nút phiên bản (grid-cols-3)
    const variantContainer = document.querySelector('.grid.grid-cols-3.gap-3');
    if (!variantContainer) return;

    const variantButtons = variantContainer.querySelectorAll('button');
    // Tìm element hiển thị giá (text-3xl)
    const priceElement = document.querySelector('.text-3xl.font-bold.text-gray-900');
    const originalPriceElement = document.querySelector('.text-sm.text-gray-400.line-through');

    variantButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset style tất cả nút về trạng thái thường
            variantButtons.forEach(b => {
                b.className = "py-3 px-2 border rounded-lg text-sm font-medium hover:border-primary dark:hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition bg-surface-light dark:bg-surface-dark border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300";
                // Xóa dấu check nếu có
                const check = b.querySelector('.absolute');
                if(check) check.remove();
            });

            // Set style active cho nút được click
            btn.className = "relative py-3 px-2 border-2 border-primary rounded-lg text-sm font-bold text-primary bg-red-50 dark:bg-red-900/20 shadow-sm";
            
            // Thêm dấu check
            const checkMark = document.createElement('span');
            checkMark.className = "absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5";
            checkMark.innerHTML = '<span class="material-icons text-xs leading-none block">check</span>';
            btn.appendChild(checkMark);

            // Cập nhật giá giả lập theo text của nút
            if (priceElement) {
                const text = btn.innerText.trim();
                let newPrice = "34.390.000₫";
                let oldPrice = "34.990.000₫";

                if (text.includes('1TB')) {
                    newPrice = "44.990.000₫";
                    oldPrice = "46.990.000₫";
                } else if (text.includes('512GB')) {
                    newPrice = "39.990.000₫";
                    oldPrice = "41.990.000₫";
                } else if (text.includes('256GB')) {
                    newPrice = "34.390.000₫";
                    oldPrice = "34.990.000₫";
                }

                // Hiệu ứng nháy giá
                priceElement.style.opacity = 0;
                setTimeout(() => {
                    priceElement.innerText = newPrice;
                    priceElement.style.opacity = 1;
                    if(originalPriceElement) originalPriceElement.innerText = oldPrice;
                }, 200);
            }
        });
    });
}

// 3. Các hành động khác (Yêu thích, Mua hàng)
function setupActions() {
    // Nút Yêu thích (tìm theo icon favorite_border)
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => {
        if (btn.innerText.includes('Yêu thích')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const icon = this.querySelector('.material-icons-outlined');
                if (icon) {
                    if (icon.innerText === 'favorite_border') {
                        icon.innerText = 'favorite';
                        icon.classList.add('text-red-500');
                        this.classList.add('text-red-500');
                    } else {
                        icon.innerText = 'favorite_border';
                        icon.classList.remove('text-red-500');
                        this.classList.remove('text-red-500');
                    }
                }
            });
        }
    });

    // Nút Mua Ngay (Gradient background)
    const buyNowBtn = document.querySelector('button.bg-gradient-to-r');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            // Hiệu ứng click
            buyNowBtn.classList.add('scale-95');
            setTimeout(() => buyNowBtn.classList.remove('scale-95'), 150);
            
            alert('Chức năng đang phát triển: Chuyển đến trang thanh toán!');
        });
    }

    // Nút Thêm vào giỏ (Border red)
    const addToCartBtn = document.querySelector('button.border-red-500.text-red-500');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
             // Animation bay vào giỏ (giả lập bằng alert)
             const icon = addToCartBtn.querySelector('.material-icons');
             if(icon) icon.classList.add('animate-bounce');
             
             setTimeout(() => {
                 if(icon) icon.classList.remove('animate-bounce');
                 alert('Đã thêm sản phẩm vào giỏ hàng thành công!');
             }, 500);
        });
    }
}

// 4. Chọn địa chỉ (Giả lập)
function setupAddressSelector() {
    const selects = document.querySelectorAll('select');
    selects.forEach(sel => {
        sel.addEventListener('change', (e) => {
            console.log('Đã chọn:', e.target.value);
            // Có thể thêm logic filter cửa hàng ở đây
        });
    });
}

