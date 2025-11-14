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
        } else {
            console.error('Failed to load categories:', data);
            showToast('Không thể tải danh mục', 'error');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Lỗi khi tải danh mục', 'error');
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
        } else {
            console.error('Failed to load brands:', data);
            showToast('Không thể tải thương hiệu', 'error');
        }
    } catch (error) {
        console.error('Error loading brands:', error);
        showToast('Lỗi khi tải thương hiệu', 'error');
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
        previewImage(file, selectedImages.length - 1);
    });
    
    e.target.value = ''; // Reset input
});

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
            ${index === 0 ? '<span class="main-badge">Ảnh chính</span>' : ''}
        `;
        
        grid.appendChild(div);
    };
    
    reader.readAsDataURL(file);
}

// Remove image
function removeImage(index) {
    selectedImages.splice(index, 1);
    
    // Rebuild preview grid
    const grid = document.getElementById('imagePreviewGrid');
    grid.innerHTML = '';
    
    selectedImages.forEach((file, i) => {
        previewImage(file, i);
    });
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
    
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('active');
    
    try {
        // Step 1: Create Product
        const productData = {
            name: document.getElementById('name').value,
            slug: document.getElementById('slug').value,
            categoryId: parseInt(document.getElementById('categoryId').value),
            brandId: parseInt(document.getElementById('brandId').value),
            shortDesc: document.getElementById('shortDesc').value,
            warrantyMonths: parseInt(document.getElementById('warrantyMonths').value),
            isActive: document.getElementById('isActive').value === 'true',
            imageUrl: '' // Will be set after upload
        };
        
        // Create FormData for product with images
        const formData = new FormData();
        
        // Add product data as JSON part
        formData.append('productDTO', new Blob([JSON.stringify(productData)], {
            type: 'application/json'
        }));
        
        // Add images
        selectedImages.forEach((file) => {
            formData.append('files', file);
        });
        
        const token = localStorage.getItem('accessToken');
        const productResponse = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const productResult = await productResponse.json();
        
        if (!productResult.success) {
            throw new Error(productResult.message || 'Tạo sản phẩm thất bại');
        }
        
        const productId = productResult.payload.id;
        
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
            });
            
            skuPromises.push(promise);
        });
        
        await Promise.all(skuPromises);
        
        showToast('Thêm sản phẩm thành công!', 'success');
        
        setTimeout(() => {
            window.location.href = './products.html';
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
    const toastMessage = document.getElementById('toastMessage');
    
    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
