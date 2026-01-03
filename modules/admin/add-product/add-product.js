// Add Product JavaScript
// BASE_URL is defined in admin-common.js
let selectedImages = [];
let skuCounter = 0;

// Initialize page after admin-common.js has loaded
window.addEventListener('load', async () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('active');
    
    // admin-common.js already handles auth check
    // Just load the data we need
    await loadCategories();
    await loadBrands();
    addSKU(); // Add first SKU by default
    
    // Hide loading overlay after everything is loaded
    loadingOverlay.classList.remove('active');
});

// Load Categories
async function loadCategories() {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${BASE_URL}/categories`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error('Categories API error:', response.status);
            // Form vẫn hoạt động ngay cả khi API lỗi
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.payload) {
            const select = document.getElementById('categoryId');
            data.payload.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
            console.log('Loaded categories:', data.payload.length);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        // Không hiện toast để không làm phiền user
    }
}

// Load Brands
async function loadBrands() {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${BASE_URL}/brands`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error('Brands API error:', response.status);
            // Form vẫn hoạt động ngay cả khi API lỗi
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.payload) {
            const select = document.getElementById('brandId');
            data.payload.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand.id;
                option.textContent = brand.name;
                select.appendChild(option);
            });
            console.log('Loaded brands:', data.payload.length);
        }
    } catch (error) {
        console.error('Error loading brands:', error);
        // Không hiện toast để không làm phiền user
    }
}

// Auto generate slug from product name
document.getElementById('name').addEventListener('input', (e) => {
    const name = e.target.value;
    const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    
    document.getElementById('slug').value = slug;
});

// Handle image selection
document.getElementById('imageInput').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach((file, index) => {
        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showToast(`File ${file.name} quá lớn (tối đa 10MB)`, 'error');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast(`File ${file.name} không phải là ảnh`, 'error');
            return;
        }
        
        selectedImages.push(file);
    });
    
    // Rebuild entire preview grid to ensure first image is always main
    rebuildImagePreview();
    
    e.target.value = ''; // Reset input
});

// Rebuild image preview grid
function rebuildImagePreview() {
    const grid = document.getElementById('imagePreviewGrid');
    grid.innerHTML = '';
    
    selectedImages.forEach((file, index) => {
        previewImage(file, index);
    });
}

// Preview image
function previewImage(file, index) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const grid = document.getElementById('imagePreviewGrid');
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.dataset.index = index;
        
        div.innerHTML = `
            <img src="${e.target.result}" alt="Preview">
            <button type="button" class="remove-image" onclick="removeImage(${index})">
                <i class="fas fa-times"></i>
            </button>
            ${index === 0 ? '<span class="main-badge"><i class="fas fa-star"></i> Ảnh chính</span>' : ''}
            ${index > 0 ? `<button type="button" class="set-main-image" onclick="setMainImage(${index})" title="Đặt làm ảnh chính">
                <i class="fas fa-star"></i>
            </button>` : ''}
        `;
        
        grid.appendChild(div);
    };
    
    reader.readAsDataURL(file);
}

// Remove image and rebuild preview
function removeImage(index) {
    selectedImages.splice(index, 1);
    rebuildImagePreview();
    
    if (selectedImages.length === 0) {
        showToast('Đã xóa tất cả ảnh', 'info');
    } else if (index === 0) {
        showToast('Ảnh đầu tiên hiện tại là ảnh chính', 'info');
    }
}

// Set image as main (move to first position)
function setMainImage(index) {
    if (index === 0) return;
    
    // Move selected image to first position
    const [selectedImage] = selectedImages.splice(index, 1);
    selectedImages.unshift(selectedImage);
    
    // Rebuild preview
    rebuildImagePreview();
    showToast('Đã đặt làm ảnh chính', 'success');
}

// Add SKU
function addSKU() {
    skuCounter++;
    const skuList = document.getElementById('skuList');
    
    const skuItem = document.createElement('div');
    skuItem.className = 'sku-item';
    skuItem.dataset.skuId = skuCounter;
    
    skuItem.innerHTML = `
        <div class="sku-item-header">
            <h3>Biến thể #${skuCounter}</h3>
            ${skuCounter > 1 ? `<button type="button" class="btn-remove-sku" onclick="removeSKU(${skuCounter})">
                <i class="fas fa-trash"></i> Xóa
            </button>` : ''}
        </div>
        
        <div class="form-grid">
            <div class="form-group">
                <label>Mã SKU <span class="required">*</span></label>
                <input type="text" name="sku_${skuCounter}_sku" class="form-control" placeholder="VD: LAPTOP-001" required>
            </div>
            
            <div class="form-group">
                <label>Tên biến thể <span class="required">*</span></label>
                <input type="text" name="sku_${skuCounter}_name" class="form-control" placeholder="VD: RAM 16GB / SSD 512GB" required>
            </div>
            
            <div class="form-group">
                <label>Giá bán (VNĐ) <span class="required">*</span></label>
                <input type="number" name="sku_${skuCounter}_price" class="form-control" min="0" step="1000" required>
            </div>
            
            <div class="form-group">
                <label>Barcode</label>
                <input type="text" name="sku_${skuCounter}_barcode" class="form-control" placeholder="Mã vạch sản phẩm">
            </div>
            
            <div class="form-group">
                <label>Trọng lượng (gram)</label>
                <input type="number" name="sku_${skuCounter}_weight" class="form-control" min="0">
            </div>
            
            <div class="form-group">
                <label>Dài (cm)</label>
                <input type="number" name="sku_${skuCounter}_length" class="form-control" min="0">
            </div>
            
            <div class="form-group">
                <label>Rộng (cm)</label>
                <input type="number" name="sku_${skuCounter}_width" class="form-control" min="0">
            </div>
            
            <div class="form-group">
                <label>Cao (cm)</label>
                <input type="number" name="sku_${skuCounter}_height" class="form-control" min="0">
            </div>
            
            <div class="form-group">
                <label>Trạng thái</label>
                <select name="sku_${skuCounter}_active" class="form-control">
                    <option value="true">Hoạt động</option>
                    <option value="false">Tạm ẩn</option>
                </select>
            </div>
        </div>
    `;
    
    skuList.appendChild(skuItem);
}

// Remove SKU
function removeSKU(skuId) {
    const skuItem = document.querySelector(`[data-sku-id="${skuId}"]`);
    if (skuItem) {
        skuItem.remove();
    }
}

// Preview Product
function previewProduct() {
    const formData = new FormData(document.getElementById('productForm'));
    const productData = {
        name: formData.get('name'),
        categoryId: formData.get('categoryId'),
        brandId: formData.get('brandId'),
        seriesCode: document.getElementById('seriesCode').value,
        shortDesc: formData.get('shortDesc'),
        warrantyMonths: formData.get('warrantyMonths'),
        images: selectedImages.length
    };
    
    console.log('Product Preview:', productData);
    alert(`Xem trước sản phẩm:\n\n${JSON.stringify(productData, null, 2)}`);
}

// Submit Form
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validation
    const nameValue = document.getElementById('name').value.trim();
    const categoryValue = document.getElementById('categoryId').value;
    const brandValue = document.getElementById('brandId').value;
    
    if (!nameValue) {
        showToast('Vui lòng nhập tên sản phẩm', 'error');
        return;
    }
    
    if (!categoryValue || categoryValue === '' || isNaN(parseInt(categoryValue))) {
        showToast('Vui lòng chọn danh mục hợp lệ', 'error');
        return;
    }
    
    if (!brandValue || brandValue === '' || isNaN(parseInt(brandValue))) {
        showToast('Vui lòng chọn thương hiệu hợp lệ', 'error');
        return;
    }
    
    if (selectedImages.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 hình ảnh', 'error');
        return;
    }
    
    // Validate SKU fields
    const skuItems = document.querySelectorAll('.sku-item');
    if (skuItems.length === 0) {
        showToast('Vui lòng thêm ít nhất 1 biến thể sản phẩm', 'error');
        return;
    }
    
    for (let item of skuItems) {
        const skuId = item.dataset.skuId;
        const skuCode = document.querySelector(`[name="sku_${skuId}_sku"]`).value.trim();
        const skuName = document.querySelector(`[name="sku_${skuId}_name"]`).value.trim();
        const skuPrice = document.querySelector(`[name="sku_${skuId}_price"]`).value;
        
        if (!skuCode) {
            showToast(`Vui lòng nhập mã SKU cho biến thể #${skuId}`, 'error');
            return;
        }
        if (!skuName) {
            showToast(`Vui lòng nhập tên cho biến thể #${skuId}`, 'error');
            return;
        }
        if (!skuPrice || isNaN(parseFloat(skuPrice)) || parseFloat(skuPrice) <= 0) {
            showToast(`Vui lòng nhập giá hợp lệ cho biến thể #${skuId}`, 'error');
            return;
        }
    }
    
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('active');
    
    try {
        // Get and validate values
        const nameVal = document.getElementById('name').value.trim();
        const slugVal = document.getElementById('slug').value.trim();
        const seriesCodeVal = document.getElementById('seriesCode').value.trim();
        const categoryIdVal = parseInt(document.getElementById('categoryId').value);
        const brandIdVal = parseInt(document.getElementById('brandId').value);
        const shortDescVal = document.getElementById('shortDesc').value.trim();
        const warrantyVal = parseInt(document.getElementById('warrantyMonths').value) || 12;
        const isActiveVal = document.getElementById('isActive').value === 'true';
        
        // Double check IDs are valid
        if (!categoryIdVal || isNaN(categoryIdVal)) {
            throw new Error('ID danh mục không hợp lệ');
        }
        if (!brandIdVal || isNaN(brandIdVal)) {
            throw new Error('ID thương hiệu không hợp lệ');
        }
        
        console.log('📦 Product data to send:', {
            name: nameVal,
            slug: slugVal || 'auto',
            seriesCode: seriesCodeVal || 'none',
            categoryId: categoryIdVal,
            brandId: brandIdVal,
            shortDesc: shortDescVal || 'none',
            warrantyMonths: warrantyVal,
            isActive: isActiveVal
        });
        
        // Create FormData for product with images
        const formData = new FormData();
        
        // Add each field separately (matching ProductDTO exactly)
        formData.append('name', nameVal);
        formData.append('categoryId', categoryIdVal.toString());
        formData.append('brandId', brandIdVal.toString());
        formData.append('isActive', isActiveVal.toString());
        formData.append('warrantyMonths', warrantyVal.toString());
        
        // Optional fields
        if (slugVal) {
            formData.append('slug', slugVal);
        }
        if (seriesCodeVal) {
            formData.append('seriesCode', seriesCodeVal);
        }
        if (shortDescVal) {
            formData.append('shortDesc', shortDescVal);
        }
        
        // Add images (first image is main image)
        selectedImages.forEach((file, index) => {
            formData.append('files', file);
            console.log(`📷 Image ${index + 1}:`, file.name);
        });
        
        const token = localStorage.getItem('accessToken');
        
        console.log('🚀 Sending request to:', `${BASE_URL}/products`);
        
        const productResponse = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type for FormData, browser will set it automatically
            },
            body: formData
        });
        
        console.log('📡 Response status:', productResponse.status);
        
        if (!productResponse.ok) {
            let errorMessage = 'Không thể tạo sản phẩm';
            try {
                const errorData = await productResponse.json();
                console.error('❌ Error response:', errorData);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                const errorText = await productResponse.text();
                console.error('❌ Error text:', errorText);
                errorMessage = errorText || errorMessage;
            }
            
            // User-friendly error messages
            if (productResponse.status === 400) {
                if (errorMessage.includes('id must not be null')) {
                    errorMessage = '⚠️ Thiếu thông tin danh mục hoặc thương hiệu. Vui lòng kiểm tra lại!';
                } else if (errorMessage.includes('duplicate') || errorMessage.includes('exists')) {
                    errorMessage = '⚠️ Mã SKU hoặc slug đã tồn tại. Vui lòng đổi tên khác!';
                }
            } else if (productResponse.status === 401) {
                errorMessage = '🔒 Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!';
            } else if (productResponse.status === 403) {
                errorMessage = '🚫 Bạn không có quyền thêm sản phẩm!';
            } else if (productResponse.status === 500) {
                errorMessage = '💥 Lỗi server. Vui lòng thử lại sau!';
            }
            
            throw new Error(errorMessage);
        }
        
        const productResult = await productResponse.json();
        console.log('✅ Product created:', productResult);
        
        if (!productResult.success) {
            throw new Error(productResult.message || 'Tạo sản phẩm thất bại');
        }
        
        const productId = productResult.payload.id;
        console.log('Product created with ID:', productId);
        
        // Step 2: Create SKUs
        const skuItems = document.querySelectorAll('.sku-item');
        const skuPromises = [];
        
        skuItems.forEach((skuItem) => {
            const skuId = skuItem.dataset.skuId;
            const skuData = {
                productId: productId,
                sku: document.querySelector(`[name="sku_${skuId}_sku"]`).value,
                name: document.querySelector(`[name="sku_${skuId}_name"]`).value,
                price: parseFloat(document.querySelector(`[name="sku_${skuId}_price"]`).value),
                barcode: document.querySelector(`[name="sku_${skuId}_barcode"]`).value || null,
                weightGram: parseInt(document.querySelector(`[name="sku_${skuId}_weight"]`).value) || null,
                lengthCm: parseInt(document.querySelector(`[name="sku_${skuId}_length"]`).value) || null,
                widthCm: parseInt(document.querySelector(`[name="sku_${skuId}_width"]`).value) || null,
                heightCm: parseInt(document.querySelector(`[name="sku_${skuId}_height"]`).value) || null,
                isActive: document.querySelector(`[name="sku_${skuId}_active"]`).value === 'true'
            };
            
            const promise = fetch(`${BASE_URL}/product-skus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(skuData)
            }).then(res => {
                if (!res.ok) {
                    console.error(`SKU creation failed for ${skuData.sku}:`, res.status);
                }
                return res;
            });
            
            skuPromises.push(promise);
        });
        
        await Promise.all(skuPromises);
        
        showToast('Thêm sản phẩm thành công!', 'success');
        
        setTimeout(() => {
            window.location.href = '../manage-products/product-sku.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error creating product:', error);
        showToast(error.message || 'Có lỗi xảy ra khi thêm sản phẩm', 'error');
    } finally {
        loadingOverlay.classList.remove('active');
    }
});

// Show Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.error('Toast element not found');
        alert(message);
        return;
    }
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
