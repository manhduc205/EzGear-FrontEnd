/* ==================== EZGEAR SHOP JS - DYNAMIC CATEGORY SECTIONS ==================== */

// API Base URL
const BASE_URL = window.BASE_URL || 'http://127.0.0.1:8080';

// Category Icons Mapping (Material Symbols)
const CATEGORY_ICONS = {
    'Điện thoại': 'smartphone',
    'Tablet': 'tablet_android',
    'Laptop': 'laptop_mac',
    'Laptop Gaming': 'sports_esports',
    'Laptop Văn phòng': 'business_center',
    'PC': 'computer',
    'Màn hình': 'tv',
    'Bàn phím': 'keyboard',
    'Chuột': 'mouse',
    'Tai nghe': 'headphones',
    'Loa': 'speaker',
    'Phụ kiện': 'keyboard',
    'Gaming': 'sports_esports',
    'Camera': 'photo_camera',
    'Đồng hồ': 'watch',
    'Âm thanh': 'headphones',
    'Nhà thông minh': 'home_iot_device',
    'Tivi': 'tv',
    'default': 'devices'
};

// Hardcoded Categories - Always display these
const HARDCODED_CATEGORIES = [
    { id: 1, name: 'Laptop Gaming', slug: 'laptop-gaming' },
    { id: 2, name: 'Laptop Văn Phòng', slug: 'laptop-van-phong' },
    { id: 3, name: 'Laptop Đồ Họa', slug: 'laptop-do-hoa' },
    { id: 4, name: 'Macbook', slug: 'macbook' },
    { id: 5, name: 'Thiết Bị Văn Phòng', slug: 'thiet-bi-van-phong' },
    { id: 6, name: 'PC Gaming', slug: 'pc-gaming' }
];

// Brands will be loaded from the API; no hardcoded brands in JS

// Mock Products - Fallback when API fails
const MOCK_PRODUCTS = {
    'laptop-gaming': [
        { id: 101, name: 'Asus ROG Strix G16 Gaming', slug: 'asus-rog-strix-g16', imageUrl: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=500&q=80', price: 32990000, brandId: 5, rating: 4.8 },
        { id: 102, name: 'Acer Nitro 5 AN515-58-52SP', slug: 'acer-nitro-5', imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=500&q=80', price: 25990000, brandId: 9, rating: 4.5 },
        { id: 103, name: 'MSI Katana 15 B13VGK-676VN', slug: 'msi-katana-15', imageUrl: 'https://images.unsplash.com/photo-1587202372775-98973b6c7b13?auto=format&fit=crop&w=500&q=80', price: 28990000, brandId: 10, rating: 4.6 },
        { id: 104, name: 'Dell G15 5530 Gaming', slug: 'dell-g15-5530', imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=500&q=80', price: 27490000, brandId: 6, rating: 4.4 },
        { id: 105, name: 'Lenovo Legion 5 Pro', slug: 'lenovo-legion-5-pro', imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80', price: 35990000, brandId: 8, rating: 4.9 },
        { id: 106, name: 'HP Victus 15-fa0031dx', slug: 'hp-victus-15', imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=500&q=80', price: 24990000, brandId: 7, rating: 4.3 },
        { id: 107, name: 'Asus TUF Gaming A15', slug: 'asus-tuf-a15', imageUrl: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=500&q=80', price: 23990000, brandId: 5, rating: 4.7 },
        { id: 108, name: 'Acer Predator Helios 300', slug: 'acer-predator-helios', imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=500&q=80', price: 38990000, brandId: 9, rating: 4.9 },
        { id: 109, name: 'MSI GF63 Thin 11UC-1228VN', slug: 'msi-gf63-thin', imageUrl: 'https://images.unsplash.com/photo-1587202372775-98973b6c7b13?auto=format&fit=crop&w=500&q=80', price: 19990000, brandId: 10, rating: 4.2 },
        { id: 110, name: 'Lenovo IdeaPad Gaming 3', slug: 'lenovo-ideapad-gaming', imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80', price: 21990000, brandId: 8, rating: 4.4 },
        { id: 111, name: 'HP Omen 16-wf0070TX Gaming', slug: 'hp-omen-16', imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=500&q=80', price: 42990000, brandId: 7, rating: 4.8 },
        { id: 112, name: 'Dell Alienware M15 R7', slug: 'dell-alienware-m15', imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=500&q=80', price: 52990000, brandId: 6, rating: 5.0 }
    ],
    'laptop-van-phong': [
        { id: 201, name: 'Dell Inspiron 15 3520', slug: 'dell-inspiron-15-3520', imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=500&q=80', price: 15990000, brandId: 6, rating: 4.3 },
        { id: 202, name: 'HP 15s-fq5229TU', slug: 'hp-15s-fq5229tu', imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=500&q=80', price: 13990000, brandId: 7, rating: 4.1 },
        { id: 203, name: 'Asus Vivobook 15 X1504VA', slug: 'asus-vivobook-15', imageUrl: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=500&q=80', price: 14990000, brandId: 5, rating: 4.4 },
        { id: 204, name: 'Lenovo IdeaPad Slim 3', slug: 'lenovo-ideapad-slim-3', imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80', price: 12990000, brandId: 8, rating: 4.2 },
        { id: 205, name: 'Acer Aspire 3 A315-59-53BV', slug: 'acer-aspire-3', imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=500&q=80', price: 11990000, brandId: 9, rating: 4.0 },
        { id: 206, name: 'MSI Modern 14 C13M-458VN', slug: 'msi-modern-14', imageUrl: 'https://images.unsplash.com/photo-1587202372775-98973b6c7b13?auto=format&fit=crop&w=500&q=80', price: 16990000, brandId: 10, rating: 4.5 },
        { id: 207, name: 'Dell Vostro 3520-V5I3614W1', slug: 'dell-vostro-3520', imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=500&q=80', price: 17990000, brandId: 6, rating: 4.3 },
        { id: 208, name: 'HP 240 G9 6L1A1PA', slug: 'hp-240-g9', imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=500&q=80', price: 10990000, brandId: 7, rating: 3.9 },
        { id: 209, name: 'Asus ExpertBook B1502CVA', slug: 'asus-expertbook-b1502', imageUrl: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=500&q=80', price: 18990000, brandId: 5, rating: 4.6 },
        { id: 210, name: 'Lenovo ThinkBook 15 G4', slug: 'lenovo-thinkbook-15', imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80', price: 19990000, brandId: 8, rating: 4.5 },
        { id: 211, name: 'Acer Aspire 5 A515-58M-518Y', slug: 'acer-aspire-5', imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=500&q=80', price: 15490000, brandId: 9, rating: 4.2 },
        { id: 212, name: 'MSI Summit E14 Flip Evo', slug: 'msi-summit-e14', imageUrl: 'https://images.unsplash.com/photo-1587202372775-98973b6c7b13?auto=format&fit=crop&w=500&q=80', price: 32990000, brandId: 10, rating: 4.7 }
    ],
    'laptop-do-hoa': [
        { id: 301, name: 'Dell Precision 5570 Workstation', slug: 'dell-precision-5570', imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=500&q=80', price: 58990000, brandId: 6, rating: 4.8 },
        { id: 302, name: 'HP ZBook Studio G9', slug: 'hp-zbook-studio-g9', imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=500&q=80', price: 62990000, brandId: 7, rating: 4.7 },
        { id: 303, name: 'Asus ProArt Studiobook 16', slug: 'asus-proart-studiobook', imageUrl: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=500&q=80', price: 68990000, brandId: 5, rating: 4.9 },
        { id: 304, name: 'Lenovo ThinkPad P15v Gen 3', slug: 'lenovo-thinkpad-p15v', imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80', price: 55990000, brandId: 8, rating: 4.6 },
        { id: 305, name: 'Acer ConceptD 7 CN715-73G', slug: 'acer-conceptd-7', imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=500&q=80', price: 72990000, brandId: 9, rating: 4.8 },
        { id: 306, name: 'MSI Creator Z17 A12UHST', slug: 'msi-creator-z17', imageUrl: 'https://images.unsplash.com/photo-1587202372775-98973b6c7b13?auto=format&fit=crop&w=500&q=80', price: 78990000, brandId: 10, rating: 4.9 },
        { id: 307, name: 'Dell XPS 15 9530', slug: 'dell-xps-15-9530', imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=500&q=80', price: 48990000, brandId: 6, rating: 4.7 },
        { id: 308, name: 'HP Envy 16-h0123TX', slug: 'hp-envy-16', imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=500&q=80', price: 42990000, brandId: 7, rating: 4.6 },
        { id: 309, name: 'Asus Zenbook Pro 15 OLED', slug: 'asus-zenbook-pro-15', imageUrl: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=500&q=80', price: 52990000, brandId: 5, rating: 4.8 },
        { id: 310, name: 'Lenovo Yoga Slim 7 Pro X', slug: 'lenovo-yoga-slim-7-pro', imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80', price: 38990000, brandId: 8, rating: 4.5 },
        { id: 311, name: 'Acer Swift X SFX16-52G', slug: 'acer-swift-x', imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=500&q=80', price: 28990000, brandId: 9, rating: 4.4 },
        { id: 312, name: 'MSI Prestige 16 Studio A13VE', slug: 'msi-prestige-16', imageUrl: 'https://images.unsplash.com/photo-1587202372775-98973b6c7b13?auto=format&fit=crop&w=500&q=80', price: 45990000, brandId: 10, rating: 4.7 }
    ],
    'macbook': [
        { id: 401, name: 'MacBook Air M3 13 inch 8GB', slug: 'macbook-air-m3-13-8gb', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', price: 27990000, brandId: 1, rating: 4.8 },
        { id: 402, name: 'MacBook Air M3 15 inch 8GB', slug: 'macbook-air-m3-15-8gb', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', price: 32990000, brandId: 1, rating: 4.9 },
        { id: 403, name: 'MacBook Air M2 13 inch 8GB', slug: 'macbook-air-m2-13-8gb', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', price: 24990000, brandId: 1, rating: 4.7 },
        { id: 404, name: 'MacBook Pro 14 inch M3 8GB', slug: 'macbook-pro-14-m3-8gb', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', price: 38990000, brandId: 1, rating: 4.9 },
        { id: 405, name: 'MacBook Pro 14 inch M3 Pro', slug: 'macbook-pro-14-m3-pro', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', price: 52990000, brandId: 1, rating: 5.0 },
        { id: 406, name: 'MacBook Pro 16 inch M3 Pro', slug: 'macbook-pro-16-m3-pro', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', price: 62990000, brandId: 1, rating: 5.0 },
        { id: 407, name: 'MacBook Pro 16 inch M3 Max', slug: 'macbook-pro-16-m3-max', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', price: 82990000, brandId: 1, rating: 5.0 },
        { id: 408, name: 'MacBook Air M1 13 inch 8GB', slug: 'macbook-air-m1-13-8gb', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', price: 19990000, brandId: 1, rating: 4.6 },
        { id: 409, name: 'MacBook Air M2 15 inch 8GB', slug: 'macbook-air-m2-15-8gb', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', price: 29990000, brandId: 1, rating: 4.8 },
        { id: 410, name: 'MacBook Pro 14 inch M2 Pro', slug: 'macbook-pro-14-m2-pro', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', price: 45990000, brandId: 1, rating: 4.9 },
        { id: 411, name: 'MacBook Pro 16 inch M2 Max', slug: 'macbook-pro-16-m2-max', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', price: 72990000, brandId: 1, rating: 4.9 },
        { id: 412, name: 'MacBook Air M3 13 inch 16GB', slug: 'macbook-air-m3-13-16gb', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', price: 32990000, brandId: 1, rating: 4.8 }
    ],
    'thiet-bi-van-phong': [
        { id: 501, name: 'Màn hình Dell UltraSharp 27 4K', slug: 'man-hinh-dell-ultrasharp-27', imageUrl: 'https://images.unsplash.com/photo-1527443195645-1133f7f28990?auto=format&fit=crop&w=500&q=80', price: 12990000, brandId: 6, rating: 4.7 },
        { id: 502, name: 'Bàn phím cơ Logitech MX Keys', slug: 'ban-phim-logitech-mx-keys', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=500&q=80', price: 2990000, brandId: 7, rating: 4.6 },
        { id: 503, name: 'Chuột Logitech MX Master 3S', slug: 'chuot-logitech-mx-master-3s', imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=500&q=80', price: 2490000, brandId: 7, rating: 4.8 },
        { id: 504, name: 'Màn hình LG UltraWide 34 inch', slug: 'man-hinh-lg-ultrawide-34', imageUrl: 'https://images.unsplash.com/photo-1527443195645-1133f7f28990?auto=format&fit=crop&w=500&q=80', price: 15990000, brandId: 8, rating: 4.6 },
        { id: 505, name: 'Webcam Logitech C920 HD Pro', slug: 'webcam-logitech-c920', imageUrl: 'https://images.unsplash.com/photo-1589739900243-c64d9498c9e7?auto=format&fit=crop&w=500&q=80', price: 1790000, brandId: 7, rating: 4.4 },
        { id: 506, name: 'Tai nghe Sony WH-1000XM5', slug: 'tai-nghe-sony-wh-1000xm5', imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=500&q=80', price: 8990000, brandId: 2, rating: 4.9 },
        { id: 507, name: 'Hub USB-C Anker 7-in-1', slug: 'hub-usbc-anker-7in1', imageUrl: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?auto=format&fit=crop&w=500&q=80', price: 1290000, brandId: 10, rating: 4.5 },
        { id: 508, name: 'Đế tản nhiệt laptop DeepCool', slug: 'de-tan-nhiet-deepcool', imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=500&q=80', price: 590000, brandId: 9, rating: 4.3 },
        { id: 509, name: 'Bàn phím Apple Magic Keyboard', slug: 'ban-phim-apple-magic', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=500&q=80', price: 2590000, brandId: 1, rating: 4.7 },
        { id: 510, name: 'Chuột Apple Magic Mouse', slug: 'chuot-apple-magic-mouse', imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=500&q=80', price: 1990000, brandId: 1, rating: 4.5 },
        { id: 511, name: 'Màn hình Samsung Odyssey G5', slug: 'man-hinh-samsung-odyssey-g5', imageUrl: 'https://images.unsplash.com/photo-1527443195645-1133f7f28990?auto=format&fit=crop&w=500&q=80', price: 8990000, brandId: 2, rating: 4.6 },
        { id: 512, name: 'Loa Bluetooth JBL Flip 6', slug: 'loa-jbl-flip-6', imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=500&q=80', price: 2890000, brandId: 10, rating: 4.5 }
    ],
    'pc-gaming': [
        { id: 601, name: 'PC Gaming Intel Core i7-13700K', slug: 'pc-gaming-i7-13700k', imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=500&q=80', price: 35990000, brandId: 5, rating: 4.7 },
        { id: 602, name: 'PC Gaming AMD Ryzen 9 7950X', slug: 'pc-gaming-ryzen-9-7950x', imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=500&q=80', price: 48990000, brandId: 10, rating: 4.9 },
        { id: 603, name: 'PC Gaming Intel Core i5-13400F', slug: 'pc-gaming-i5-13400f', imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=500&q=80', price: 22990000, brandId: 5, rating: 4.4 },
        { id: 604, name: 'PC Gaming AMD Ryzen 7 5800X3D', slug: 'pc-gaming-ryzen-7-5800x3d', imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=500&q=80', price: 28990000, brandId: 10, rating: 4.6 },
        { id: 605, name: 'PC Gaming Intel Core i9-14900K', slug: 'pc-gaming-i9-14900k', imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=500&q=80', price: 58990000, brandId: 5, rating: 4.9 },
        { id: 606, name: 'PC Gaming AMD Ryzen 5 7600X', slug: 'pc-gaming-ryzen-5-7600x', imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=500&q=80', price: 18990000, brandId: 10, rating: 4.3 },
        { id: 607, name: 'PC Gaming Intel Core i7-12700K', slug: 'pc-gaming-i7-12700k', imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=500&q=80', price: 32990000, brandId: 5, rating: 4.6 },
        { id: 608, name: 'PC Gaming AMD Ryzen 9 5950X', slug: 'pc-gaming-ryzen-9-5950x', imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=500&q=80', price: 42990000, brandId: 10, rating: 4.8 },
        { id: 609, name: 'PC Gaming Intel Core i5-12400F', slug: 'pc-gaming-i5-12400f', imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=500&q=80', price: 16990000, brandId: 5, rating: 4.2 },
        { id: 610, name: 'PC Gaming AMD Ryzen 7 7700X', slug: 'pc-gaming-ryzen-7-7700x', imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=500&q=80', price: 25990000, brandId: 10, rating: 4.5 },
        { id: 611, name: 'PC Gaming Intel Core i7-14700K', slug: 'pc-gaming-i7-14700k', imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=500&q=80', price: 38990000, brandId: 5, rating: 4.8 },
        { id: 612, name: 'PC Gaming AMD Ryzen 5 5600X', slug: 'pc-gaming-ryzen-5-5600x', imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=500&q=80', price: 14990000, brandId: 10, rating: 4.1 }
    ]
};

// State Management
const shopState = {
    categories: [...HARDCODED_CATEGORIES], // Use hardcoded categories by default
    allBrands: [], // load from API (empty until fetched)
    currentSlide: 0,
    bannerImages: [
        'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1481277542470-605612bd2d61?auto=format&fit=crop&w=1400&q=80'
    ],
    // State for each category section
    categorySections: {}
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Render star icons for rating (0-5)
 */
function renderStars(rating) {
    const full = Math.floor(rating);
    const half = (rating - full) >= 0.5;
    let html = '';
    
    const starSvg = `<svg class="star-icon" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>`;
    const halfStarSvg = `<svg class="star-icon half" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="half"><stop offset="50%" stop-color="#f59e0b"/><stop offset="50%" stop-color="#d1d5db"/></linearGradient></defs><path fill="url(#half)" d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>`;
    const emptyStarSvg = `<svg class="star-icon empty" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>`;
    
    for (let i = 0; i < full; i++) html += starSvg;
    if (half) html += halfStarSvg;
    const remaining = 5 - full - (half ? 1 : 0);
    for (let i = 0; i < remaining; i++) html += emptyStarSvg;
    return html;
}

// ==================== API CALLS ====================

/**
 * Load all categories from API
 */
async function loadCategories() {
    try {
        const url = `${BASE_URL}/api/categories`;
        const data = await httpRequest(url, { method: 'GET' });
        const apiCategories = data.payload || data || [];
        if (apiCategories.length > 0) {
            shopState.categories = apiCategories;
            console.log('✅ Categories loaded from API:', shopState.categories.length);
        } else {
            console.log('📌 Using hardcoded categories');
        }
        return shopState.categories;
    } catch (error) {
        console.warn('⚠️ API Error, using hardcoded categories:', error.message);
        // Keep hardcoded categories already in shopState
        return shopState.categories;
    }
}

// Mock brands for fallback when API fails
const MOCK_BRANDS = [
    { id: 1, name: 'Apple', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
    { id: 2, name: 'Samsung', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
    { id: 5, name: 'Asus', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/ASUS_Logo.svg' },
    { id: 6, name: 'Dell', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg' },
    { id: 7, name: 'HP', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg' },
    { id: 8, name: 'Lenovo', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg' },
    { id: 9, name: 'Acer', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Acer_2011.svg' },
    { id: 10, name: 'MSI', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/MSI_Logo.svg' }
];

/**
 * Load all brands from API
 */
async function loadAllBrands() {
    try {
        const url = `${BASE_URL}/api/brands`;
        const data = await httpRequest(url, { method: 'GET' });
        const apiBrands = data.payload || data || [];
        if (apiBrands.length > 0) {
            shopState.allBrands = apiBrands;
            console.log('✅ Brands loaded from API:', shopState.allBrands.length);
        } else {
            // API returned empty list — use mock brands
            console.log('📌 Using mock brands');
            shopState.allBrands = MOCK_BRANDS;
        }
        return shopState.allBrands;
    } catch (error) {
        console.warn('⚠️ Brands API Error, using mock brands:', error.message);
        // Use mock brands as fallback
        shopState.allBrands = MOCK_BRANDS;
        return shopState.allBrands;
    }
}

/**
 * Load products by category slug with filters
 * @param {string} slug - Category slug (e.g., 'laptop-gaming', 'laptop-van-phong')
 * @param {object} options - Filter options { limit, page, sortBy, brandId }
 */
async function loadProductsByCategorySlug(slug, options = {}) {
    const { limit = 12, page = 0, sortBy = '', brand = null } = options;
    
    try {
        // API path and brand filter uses name/slug parameter 'brand'
        let url = `${BASE_URL}/api/products/public/category/${slug}?page=${page}&limit=${limit}`;
        
        // Add sorting parameter
        if (sortBy === 'price-asc') {
            url += '&sort=price,asc';
        } else if (sortBy === 'price-desc') {
            url += '&sort=price,desc';
        }
        
        // Add brand filter (string)
        if (brand) {
            url += `&brand=${encodeURIComponent(brand)}`;
            console.log('🔍 Filtering by brand:', brand);
        }
        
        console.log('📡 API Request URL:', url);
        const data = await httpRequest(url, { method: 'GET' });
        console.log('📦 API Response:', data);
        
        if (data && (data.success || data.payload)) {
            const payload = data.payload || data;
            // Extract products array (support payload.content or direct array)
            let products = payload.content || (Array.isArray(payload) ? payload : []);

            // Client-side sorting: backend may not sort, so apply sort here when requested
            if (sortBy === 'price-asc') {
                products = [...products].sort((a, b) => (a.price || 0) - (b.price || 0));
            } else if (sortBy === 'price-desc') {
                products = [...products].sort((a, b) => (b.price || 0) - (a.price || 0));
            }

            return {
                products: products,
                totalPages: payload.totalPages || 1,
                totalElements: payload.totalElements || (Array.isArray(payload) ? payload.length : products.length),
                last: payload.last || false
            };
        }
        
        return { products: [], totalPages: 0, totalElements: 0, last: true };
    } catch (error) {
        console.warn(`⚠️ API Error for ${slug}, using mock data:`, error.message);
        
        // Use mock products as fallback
        let products = MOCK_PRODUCTS[slug] || [];
        
        // Apply brand filter if specified (brand is string) -> map names to ids using MOCK_BRANDS
        if (brand && products.length > 0) {
            const brandKey = ('' + brand).toLowerCase();
            // Try to map brand key to id via MOCK_BRANDS
            const matched = MOCK_BRANDS.find(b => (b.slug && b.slug.toLowerCase() === brandKey) || (b.name && b.name.toLowerCase() === brandKey));
            if (matched) {
                products = products.filter(p => p.brandId === matched.id);
            } else {
                // If no mapping, attempt simple name match in product brandName
                products = products.filter(p => (p.brandName || '').toLowerCase() === brandKey);
            }
        }
        
        // Apply sorting
        if (sortBy === 'price-asc') {
            products = [...products].sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            products = [...products].sort((a, b) => b.price - a.price);
        }
        
        // Apply pagination
        const start = page * limit;
        const paginatedProducts = products.slice(start, start + limit);
        
        return {
            products: paginatedProducts,
            totalPages: Math.ceil(products.length / limit),
            totalElements: products.length,
            last: start + limit >= products.length
        };
    }
}

/**
 * Load brands by category slug
 */
async function loadBrandsByCategorySlug(slug) {
    try {
        const url = `${BASE_URL}/api/brands/category/${slug}`;
        const data = await httpRequest(url, { method: 'GET' });
        
        // Handle different response structures
        let categoryBrands = [];
        if (data && data.payload) {
            categoryBrands = Array.isArray(data.payload) ? data.payload : [];
        } else if (Array.isArray(data)) {
            categoryBrands = data;
        } else if (data && data.data) {
            categoryBrands = Array.isArray(data.data) ? data.data : [];
        }
        
        console.log(`🔍 Brands for category ${slug}:`, categoryBrands);
        
        if (categoryBrands.length > 0) {
            return categoryBrands;
        } else {
            console.log(`⚠️ No brands returned from API for ${slug}`);
        }
    } catch (error) {
        console.warn(`⚠️ Brands by category API error for ${slug}:`, error.message);
    }
    
    // Fallback: return mock brands filtered by products in this category
    const categoryProducts = MOCK_PRODUCTS[slug] || [];
    const brandIds = [...new Set(categoryProducts.map(p => p.brandId))];
    const fallbackBrands = MOCK_BRANDS.filter(b => brandIds.includes(b.id));
    console.log(`📌 Using ${fallbackBrands.length} fallback brands for ${slug}`);
    return fallbackBrands;
}

/**
 * Add item to cart
 */
async function addToCart(productId, productName, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (!TokenHelper.isLoggedIn()) {
        showToast('Vui lòng đăng nhập để thêm vào giỏ hàng', 'warning');
        setTimeout(() => window.location.href = '../auth/auth.html', 1500);
        return;
    }

    try {
        const url = `${BASE_URL}/api/cart/add`;
        await httpRequest(url, { method: 'POST', body: JSON.stringify({ productId: productId, quantity: 1 }) });
        showToast(`Đã thêm "${productName}" vào giỏ hàng!`, 'success');
        updateCartBadge();
    } catch (error) {
        showToast(error.message || 'Không thể thêm vào giỏ hàng', 'error');
    }
}

/**
 * Update cart badge count
 */
async function updateCartBadge() {
    if (!TokenHelper.isLoggedIn()) return;

    try {
        const url = `${BASE_URL}/api/cart`;
        const data = await httpRequest(url, { method: 'GET' });
        const cart = data.payload || data;
        const items = cart.items || cart.cartItems || [];
        const badge = document.getElementById('cartBadge');
        if (badge) badge.textContent = items.length;
    } catch (error) {
        // Silently fail - cart badge is not critical
        console.debug('Cart badge update skipped:', error.message);
    }
}

// ==================== CATEGORY SECTION COMPONENT ====================

/**
 * CategorySection - Component to render a category section with products
 */
class CategorySection {
    constructor(container, { title, slug, limit = 12 }) {
        this.container = container;
        this.title = title;
        this.slug = slug;
        this.limit = limit;
        this.products = [];
        this.brands = [];
        this.loading = true;
        this.error = false;
        this.selectedBrand = null;
        this.sortBy = '';
        this.sectionId = `category-section-${slug}`;
        
        // Initialize state for this section
        shopState.categorySections[slug] = {
            selectedBrand: null,
            sortBy: ''
        };
        
        this.render();
        this.loadData();
    }
    
    /**
     * Render the section structure
     */
    render() {
        this.container.innerHTML = `
            <section class="category-section" id="${this.sectionId}">
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="title-bar"></span>
                        ${this.title.toUpperCase()}
                    </h2>
                    <a href="./shop-list.html?category=${this.slug}" class="view-all-link">
                        Xem tất cả >>
                    </a>
                </div>
                
                <!-- Filters Row -->
                <div class="filters-row" id="filters-${this.slug}">
                    <div class="brand-filters" id="brand-filters-${this.slug}">
                        <!-- Brand filters will be loaded -->
                        <div class="filter-skeleton"></div>
                    </div>
                    <div class="price-filter">
                        <select class="price-sort-select" id="price-sort-${this.slug}" onchange="handlePriceSort('${this.slug}', this.value)">
                            <option value="">Sắp xếp theo giá</option>
                            <option value="price-asc">Giá: Thấp đến Cao</option>
                            <option value="price-desc">Giá: Cao đến Thấp</option>
                        </select>
                    </div>
                </div>
                
                <!-- Products Grid -->
                <div class="products-grid grid-12" id="products-grid-${this.slug}">
                    ${this.renderSkeletonCards()}
                </div>
            </section>
        `;
    }
    
    /**
     * Load brands and products data
     */
    async loadData() {
        try {
            // Load brands for this category
            this.brands = await loadBrandsByCategorySlug(this.slug);
            this.renderBrandFilters();
            
            // Load products
            await this.loadProducts();
            
            this.loading = false;
            this.error = false;
        } catch (error) {
            console.error(`Error loading data for ${this.slug}:`, error);
            this.loading = false;
            this.error = true;
            this.renderError();
        }
    }
    
    /**
     * Load products with current filters
     */
    async loadProducts() {
        const gridContainer = document.getElementById(`products-grid-${this.slug}`);
        if (!gridContainer) return;
        
        // Show skeleton loading
        gridContainer.innerHTML = this.renderSkeletonCards();
        
        const state = shopState.categorySections[this.slug];
        console.log('🔄 Loading products with filters:', { 
            slug: this.slug, 
            brand: state.selectedBrand, 
            sortBy: state.sortBy 
        });
        
        const result = await loadProductsByCategorySlug(this.slug, {
            limit: this.limit,
            page: 0,
            sortBy: state.sortBy,
            brand: state.selectedBrand
        });
        
        console.log('✅ Products loaded:', result.products.length);
        this.products = result.products;
        this.renderProducts();
    }
    
    /**
     * Render brand filter buttons
     */
    renderBrandFilters() {
        const container = document.getElementById(`brand-filters-${this.slug}`);
        if (!container) return;
        
        let html = `
            <button class="brand-filter-btn active" 
                    data-slug="${this.slug}"
                    data-brand="">
                Tất cả
            </button>
        `;

        this.brands.forEach(brand => {
            const brandKey = brand.slug || (brand.name || '').toLowerCase();
            html += `
                <button class="brand-filter-btn" 
                        data-slug="${this.slug}"
                        data-brand="${brandKey}">
                    ${brand.name}
                </button>
            `;
        });
        
        container.innerHTML = html;
        
        // Add event listeners to all brand filter buttons
        container.querySelectorAll('.brand-filter-btn').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                const slug = this.getAttribute('data-slug');
                const brandStr = this.getAttribute('data-brand');
                const brand = brandStr ? brandStr : null;

                await handleBrandFilter(slug, brand, this);
            });
        });
    }
    
    /**
     * Render skeleton loading cards
     */
    renderSkeletonCards() {
        let html = '';
        for (let i = 0; i < this.limit; i++) {
            html += `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-image"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-price"></div>
                </div>
            `;
        }
        return html;
    }
    
    /**
     * Render products grid
     */
    renderProducts() {
        const container = document.getElementById(`products-grid-${this.slug}`);
        if (!container) return;
        
        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <span class="material-symbols-outlined">inventory_2</span>
                    <p>Không tìm thấy sản phẩm</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.products.map(product => this.renderProductCard(product)).join('');
    }
    
    /**
     * Render a single product card
     */
    renderProductCard(product) {
        const {
            id,
            name = 'Sản phẩm',
            slug = '',
            imageUrl = 'https://via.placeholder.com/300x200?text=No+Image',
            price = 0,
            rating = null,
            ratingAverage = null,
            reviewCount = 0,
            isCurrent = false
        } = product;
        
        const formattedPrice = this.formatPrice(price);
        const displayRating = ratingAverage || rating;
        
        return `
            <div class="product-card" onclick="viewProductDetail('${slug}')">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${name}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" 
                         loading="lazy">
                </div>
                <h3 class="product-name" title="${name}">${name}</h3>
                <div class="product-price-row">
                    <span class="product-price">${formattedPrice}</span>
                </div>
                ${displayRating ? `<div class="product-rating">${renderStars(displayRating)} <span class="rating-value">${displayRating.toFixed(1)}</span> <span class="review-count">(${reviewCount})</span></div>` : ''}
                <button class="btn-add-cart" onclick="addToCart(${id}, '${name.replace(/'/g, "\\'")}', event)">
                    <span class="material-symbols-outlined">add_shopping_cart</span>
                    Thêm vào giỏ
                </button>
            </div>
        `;
    }
    
    /**
     * Format price to Vietnamese currency
     */
    formatPrice(price) {
        if (price === 0 || price === null || price === undefined) {
            return 'Liên hệ';
        }
        return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
    }
    
    /**
     * Render error state
     */
    renderError() {
        const container = document.getElementById(`products-grid-${this.slug}`);
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-state">
                <span class="material-symbols-outlined">error</span>
                <p>Có lỗi xảy ra khi tải sản phẩm</p>
                <button class="btn-retry" onclick="reloadCategorySection('${this.slug}')">
                    Thử lại
                </button>
            </div>
        `;
    }
}

// ==================== GLOBAL EVENT HANDLERS ====================

/**
 * Handle brand filter selection
 */
async function handleBrandFilter(slug, brand, buttonEl) {
    console.log('🎯 Brand filter clicked:', { slug, brand, buttonEl });
    
    // Update active state
    const container = document.getElementById(`brand-filters-${slug}`);
    if (container) {
        container.querySelectorAll('.brand-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        buttonEl.classList.add('active');
    }
    
    // Update state (store the brand key/string)
    shopState.categorySections[slug].selectedBrand = brand;
    console.log('📊 Updated state:', shopState.categorySections[slug]);
    
    // Reload products
    const section = shopState.categorySections[slug].instance;
    if (section) {
        await section.loadProducts();
    } else {
        // Fallback: find and reload
        await reloadCategorySectionProducts(slug);
    }
}

/**
 * Handle price sort selection
 */
async function handlePriceSort(slug, sortValue) {
    // Update state
    shopState.categorySections[slug].sortBy = sortValue;
    
    // Reload products
    await reloadCategorySectionProducts(slug);
}

/**
 * Reload products for a category section
 */
async function reloadCategorySectionProducts(slug) {
    const gridContainer = document.getElementById(`products-grid-${slug}`);
    if (!gridContainer) return;
    
    // Show loading
    gridContainer.innerHTML = renderGlobalSkeletonCards(12);
    
    const state = shopState.categorySections[slug];
    const result = await loadProductsByCategorySlug(slug, {
        limit: 12,
        page: 0,
        sortBy: state.sortBy,
        brand: state.selectedBrand
    });
    
    if (result.products.length === 0) {
        gridContainer.innerHTML = `
            <div class="no-products">
                <span class="material-symbols-outlined">inventory_2</span>
                <p>Không tìm thấy sản phẩm</p>
            </div>
        `;
        return;
    }
    
    gridContainer.innerHTML = result.products.map(product => {
        const {
            id,
            name = 'Sản phẩm',
            slug: productSlug = '',
            imageUrl = 'https://via.placeholder.com/300x200?text=No+Image',
            price = 0,
            rating = null,
            ratingAverage = null,
            reviewCount = 0
        } = product;
        
        const formattedPrice = price === 0 ? 'Liên hệ' : new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
        const displayRating = ratingAverage || rating;
        
        return `
            <div class="product-card" onclick="viewProductDetail('${productSlug}')">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${name}" 
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" 
                         loading="lazy">
                </div>
                <h3 class="product-name" title="${name}">${name}</h3>
                <div class="product-price-row">
                    <span class="product-price">${formattedPrice}</span>
                </div>
                ${displayRating ? `<div class="product-rating">${renderStars(displayRating)} <span class="rating-value">${displayRating.toFixed(1)}</span> <span class="review-count">(${reviewCount})</span></div>` : ''}
                <button class="btn-add-cart" onclick="addToCart(${id}, '${name.replace(/'/g, "\\'")}', event)">
                    <span class="material-symbols-outlined">add_shopping_cart</span>
                    Thêm vào giỏ
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Reload entire category section
 */
function reloadCategorySection(slug) {
    const category = shopState.categories.find(c => c.slug === slug);
    if (!category) return;
    
    const container = document.querySelector(`#category-section-${slug}`);
    if (container) {
        const sectionWrapper = container.parentElement;
        new CategorySection(sectionWrapper, {
            title: category.name,
            slug: category.slug,
            limit: 12
        });
    }
}

/**
 * Render skeleton cards (global helper)
 */
function renderGlobalSkeletonCards(count = 12) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text short"></div>
                <div class="skeleton skeleton-price"></div>
            </div>
        `;
    }
    return html;
}

// ==================== RENDERING ====================

/**
 * Render sidebar categories
 */
function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    let html = '';
    shopState.categories.forEach((cat, index) => {
        const icon = CATEGORY_ICONS[cat.name] || CATEGORY_ICONS['default'];
        html += `
            <div class="sidebar-item ${index === 0 ? 'active' : ''}" 
                 data-category-slug="${cat.slug}" 
                 onclick="scrollToCategory('${cat.slug}')">
                <div class="item-left">
                    <span class="material-symbols-outlined">${icon}</span>
                    <span>${cat.name}</span>
                </div>
                <span class="material-symbols-outlined arrow">chevron_right</span>
            </div>
        `;
    });

    // Add extra items
    html += `
        <div class="sidebar-item" onclick="window.location.href='#'">
            <div class="item-left">
                <span class="material-symbols-outlined">newspaper</span>
                <span>Tin công nghệ</span>
            </div>
            <span class="material-symbols-outlined arrow">chevron_right</span>
        </div>
    `;

    nav.innerHTML = html;
}

/**
 * Scroll to a category section
 */
function scrollToCategory(slug) {
    const section = document.getElementById(`category-section-${slug}`);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Update active sidebar item
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.categorySlug === slug);
        });
    }
}

/**
 * Render all category sections
 */
async function renderCategorySections() {
    const container = document.getElementById('categorySectionsContainer');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Create a section for each category
    for (const category of shopState.categories) {
        const sectionWrapper = document.createElement('div');
        sectionWrapper.className = 'category-section-wrapper';
        container.appendChild(sectionWrapper);
        
        // Create CategorySection instance
        const section = new CategorySection(sectionWrapper, {
            title: category.name,
            slug: category.slug,
            limit: 12
        });
        
        // Store reference
        shopState.categorySections[category.slug].instance = section;
    }
}

/**
 * Render brands grid
 */
function renderBrandsGrid() {
    const container = document.getElementById('brandsGrid');
    if (!container) return;
    // If API didn't return brands, show a subtle message instead of hardcoding logos
    if (!shopState.allBrands || shopState.allBrands.length === 0) {
        container.innerHTML = '<p class="no-brands">Không có thương hiệu để hiển thị</p>';
        return;
    }

    // Render brand logos using data from API (logoUrl) with graceful fallback
    const placeholder = 'https://via.placeholder.com/150x50?text=Logo';
    let html = '';
    shopState.allBrands.slice(0, 12).forEach((brand) => {
        const logo = brand.logoUrl || placeholder;
        html += `
            <div class="brand-item" onclick="filterGlobalByBrand(${brand.id})">
                <img src="${logo}" alt="${brand.name}" 
                     onerror="this.src='${placeholder}'">
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Filter all sections by brand (from brands grid)
 */
function filterGlobalByBrand(brandId) {
    // Scroll to first category section
    const firstSection = document.querySelector('.category-section');
    if (firstSection) {
        firstSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    showToast('Đã chọn lọc theo thương hiệu', 'info');
}

// ==================== BANNER SLIDER ====================

/**
 * Initialize banner slider
 */
function initBannerSlider() {
    const slider = document.getElementById('bannerSlider');
    const dotsContainer = document.getElementById('bannerDots');
    if (!slider || !dotsContainer) return;

    let slidesHtml = '';
    let dotsHtml = '';

    shopState.bannerImages.forEach((img, index) => {
        slidesHtml += `
            <div class="banner-slide ${index === 0 ? 'active' : ''}">
                <img src="${img}" alt="Banner ${index + 1}">
            </div>
        `;
        dotsHtml += `<div class="banner-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>`;
    });

    slider.innerHTML = slidesHtml;
    dotsContainer.innerHTML = dotsHtml;

    // Auto slide
    setInterval(() => nextSlide(), 5000);
}

function nextSlide() {
    shopState.currentSlide = (shopState.currentSlide + 1) % shopState.bannerImages.length;
    updateSlider();
}

function prevSlide() {
    shopState.currentSlide = (shopState.currentSlide - 1 + shopState.bannerImages.length) % shopState.bannerImages.length;
    updateSlider();
}

function goToSlide(index) {
    shopState.currentSlide = index;
    updateSlider();
}

function updateSlider() {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dot');

    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === shopState.currentSlide);
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === shopState.currentSlide);
    });
}

// ==================== UTILITIES ====================

function formatPrice(price) {
    if (price === 0 || price === null || price === undefined) {
        return 'Liên hệ';
    }
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
}

/**
 * Render star icons for rating (0-5)
 */
function renderStars(rating) {
    const full = Math.floor(rating);
    const half = (rating - full) >= 0.5;
    let html = '';
    
    const starSvg = `<svg class="star-icon" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>`;
    const halfStarSvg = `<svg class="star-icon half" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="half"><stop offset="50%" stop-color="#f59e0b"/><stop offset="50%" stop-color="#d1d5db"/></linearGradient></defs><path fill="url(#half)" d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>`;
    const emptyStarSvg = `<svg class="star-icon empty" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>`;
    
    for (let i = 0; i < full; i++) html += starSvg;
    if (half) html += halfStarSvg;
    const remaining = 5 - full - (half ? 1 : 0);
    for (let i = 0; i < remaining; i++) html += emptyStarSvg;
    return html;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    toast.innerHTML = `
        <span class="material-symbols-outlined">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('show', show);
    }
}

/**
 * View product detail
 */
function viewProductDetail(slug) {
    if (slug) {
        window.location.href = `product-detail.html?slug=${encodeURIComponent(slug)}`;
    }
}

/**
 * Add to wishlist
 */
function addToWishlist(productId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    showToast('Đã thêm vào danh sách yêu thích!', 'success');
}

// ==================== INITIALIZATION ====================

async function initShop() {
    console.log('🚀 Initializing EzGear Shop...');
    showLoading(true);

    try {
        // Load data in parallel
        await Promise.all([
            loadCategories(),
            loadAllBrands()
        ]);

        // Render UI components
        renderSidebar();
        renderBrandsGrid();
        initBannerSlider();
        
        // Render category sections (main feature)
        await renderCategorySections();

        // Update cart badge
        if (typeof TokenHelper !== 'undefined' && TokenHelper.isLoggedIn()) {
            updateCartBadge();
        }

        console.log('✅ EzGear Shop initialized successfully');
    } catch (error) {
        console.error('❌ Init shop error:', error);
        showToast('Có lỗi xảy ra khi tải trang', 'error');
    } finally {
        showLoading(false);
    }
}

// Export functions to window
window.initShop = initShop;
window.scrollToCategory = scrollToCategory;
window.handleBrandFilter = handleBrandFilter;
window.handlePriceSort = handlePriceSort;
window.reloadCategorySection = reloadCategorySection;
window.filterGlobalByBrand = filterGlobalByBrand;
window.viewProductDetail = viewProductDetail;
window.addToCart = addToCart;
window.addToWishlist = addToWishlist;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.goToSlide = goToSlide;
