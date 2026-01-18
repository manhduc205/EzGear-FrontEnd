/**
 * Shop List Page - Complete Product Listing
 * Displays all products from a category with filtering, sorting, and pagination
 */

// ==================== CONSTANTS ====================

// Use global BASE_URL from api.js for consistency
const API_BASE_URL = window.BASE_URL || 'http://127.0.0.1:8080';

// Mock brands for fallback when API fails
const LIST_MOCK_BRANDS = [
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Samsung' },
    { id: 5, name: 'Asus' },
    { id: 6, name: 'Dell' },
    { id: 7, name: 'HP' },
    { id: 8, name: 'Lenovo' },
    { id: 9, name: 'Acer' },
    { id: 10, name: 'MSI' }
];

// Mock products by category (same as shop.js) - local name to avoid global collision
const LIST_MOCK_PRODUCTS = {
    'laptop-gaming': [
        { id: 101, name: 'Asus ROG Strix G16 Gaming', slug: 'asus-rog-strix-g16', imageUrl: 'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=500&q=80', price: 32990000, brandId: 5, rating: 4.8, rating: 4.8 },
        { id: 102, name: 'Acer Nitro 5 AN515-58-52SP', slug: 'acer-nitro-5', imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=500&q=80', price: 25990000, brandId: 9, rating: 4.5, rating: 4.5 },
        { id: 103, name: 'MSI Katana 15 B13VGK-676VN', slug: 'msi-katana-15', imageUrl: 'https://images.unsplash.com/photo-1587202372775-98973b6c7b13?auto=format&fit=crop&w=500&q=80', price: 28990000, brandId: 10, rating: 4.6, rating: 4.6 },
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

const CATEGORY_NAMES = {
    'laptop-gaming': 'Laptop Gaming',
    'laptop-van-phong': 'Laptop Văn Phòng',
    'laptop-do-hoa': 'Laptop Đồ Họa',
    'macbook': 'Macbook',
    'thiet-bi-van-phong': 'Thiết Bị Văn Phòng',
    'pc-gaming': 'PC Gaming'
};

// ==================== STATE ====================

const listState = {
    categorySlug: '',
    categoryName: '',
    allProducts: [],
    displayedProducts: [],
    brands: [],
    filters: {
        brand: null,
        priceRange: 'all',
        sort: ''
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 12,
        totalPages: 1
    }
};

// ==================== API FUNCTIONS ====================

/**
 * Load brands from API or fallback
 */
async function loadBrands() {
    const url = `${API_BASE_URL}/api/brands`;
    try {
        // Try a simple fetch first (avoid httpRequest to prevent auth header issues)
        const resp = await fetch(url, { method: 'GET' });
        if (resp.ok) {
            const data = await resp.json();
            // Support payload wrapper or direct array
            const brands = data.payload || data || [];
            if (Array.isArray(brands) && brands.length > 0) return brands;
        }

        // If server returned 403, try public endpoint (some backends expose public brands)
        if (resp.status === 403) {
            try {
                const publicResp = await fetch(`${API_BASE_URL}/api/brands/public`, { method: 'GET' });
                if (publicResp.ok) {
                    const publicData = await publicResp.json();
                    const publicBrands = publicData.payload || publicData || [];
                    if (Array.isArray(publicBrands) && publicBrands.length > 0) return publicBrands;
                }
            } catch (err) {
                console.warn('Public brands endpoint failed:', err.message);
            }
        }

        throw new Error(`Brands API returned status ${resp.status}`);
    } catch (error) {
        console.warn('⚠️ Brands API error, using mock brands fallback:', error.message);
        // Return mock brands filtered by products in selected category
        const categoryProducts = LIST_MOCK_PRODUCTS[listState.categorySlug] || [];
        const brandIds = [...new Set(categoryProducts.map(p => p.brandId))];
        return LIST_MOCK_BRANDS.filter(b => brandIds.includes(b.id));
    }
}

/**
 * Load products by category slug
 */
async function loadProducts(categorySlug, brand = null) {
    try {
        const limit = listState.pagination.itemsPerPage || 12;
        const page = 0;
        let url = `${API_BASE_URL}/api/products/public/category/${categorySlug}?page=${page}&limit=${limit}`;
        if (brand) url += `&brand=${encodeURIComponent(brand)}`;

        const response = await httpRequest(url, { method: 'GET' });
        
        // Support APIs that return payload or raw array
        if (response && (response.success || response.payload)) {
            const payload = response.payload || response;
            if (payload.content) return payload.content;
            if (Array.isArray(payload)) return payload;
        }
        throw new Error('Invalid response');
    } catch (error) {
        console.warn(`⚠️ Using mock products for ${categorySlug}:`, error.message);
        // Fallback: apply brand filter on mock data
        let products = LIST_MOCK_PRODUCTS[categorySlug] || [];
        if (brand) {
            const bKey = ('' + brand).toLowerCase();
            const matched = LIST_MOCK_BRANDS.find(b => (b.slug && b.slug.toLowerCase() === bKey) || (b.name && b.name.toLowerCase() === bKey));
            if (matched) {
                products = products.filter(p => p.brandId === matched.id);
            } else {
                products = products.filter(p => (p.brandName || '').toLowerCase() === bKey || (p.slug || '').toLowerCase().includes(bKey));
            }
        }
        return products;
    }
}

// ==================== FILTER & SORT ====================

/**
 * Apply all filters to products
 */
function applyFilters() {
    let filtered = [...listState.allProducts];
    
    // Brand filter (string key)
    if (listState.filters.brand) {
        const bKey = ('' + listState.filters.brand).toLowerCase();
        const matched = LIST_MOCK_BRANDS.find(b => (b.slug && b.slug.toLowerCase() === bKey) || (b.name && b.name.toLowerCase() === bKey));
        if (matched) {
            filtered = filtered.filter(p => p.brandId === matched.id);
        } else {
            filtered = filtered.filter(p => (p.brandName || '').toLowerCase() === bKey || (p.slug || '').toLowerCase().includes(bKey));
        }
    }
    
    // Price range filter
    if (listState.filters.priceRange !== 'all') {
        const [min, max] = listState.filters.priceRange.split('-').map(v => parseInt(v) * 1000000);
        if (max) {
            filtered = filtered.filter(p => p.price >= min && p.price < max);
        } else {
            filtered = filtered.filter(p => p.price >= min);
        }
    }
    
    // Sort
    switch (listState.filters.sort) {
        case 'price-asc':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filtered.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
            break;
        case 'name-desc':
            filtered.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
            break;
    }
    
    listState.displayedProducts = filtered;
    listState.pagination.currentPage = 1;
    listState.pagination.totalPages = Math.ceil(filtered.length / listState.pagination.itemsPerPage);
    
    renderProducts();
    renderPagination();
    updateProductCount();
}

/**
 * Get paginated products
 */
function getPaginatedProducts() {
    const start = (listState.pagination.currentPage - 1) * listState.pagination.itemsPerPage;
    const end = start + listState.pagination.itemsPerPage;
    return listState.displayedProducts.slice(start, end);
}

// ==================== RENDER FUNCTIONS ====================

/**
 * Render brand filters
 */
function renderBrandFilters() {
    const container = document.getElementById('brandFilters');
    if (!container) return;
    
    const allBtn = `
        <button class="brand-filter-btn active" data-brand="">
            Tất cả
        </button>
    `;

    const brandBtns = listState.brands.map(brand => {
        const key = brand.slug || (brand.name || '').toLowerCase();
        return `
            <button class="brand-filter-btn" data-brand="${key}">
                ${brand.name}
            </button>
        `;
    }).join('');
    
    container.innerHTML = allBtn + brandBtns;
}

/**
 * Render star icons for a rating (0-5)
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

/**
 * Render products grid
 */
function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    const products = getPaginatedProducts();
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <span class="material-symbols-outlined">search_off</span>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Vui lòng thử thay đổi bộ lọc</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => {
        const displayRating = product.ratingAverage || product.rating;
        const reviewCount = product.reviewCount || 0;
        
        return `
        <div class="product-card" data-product-id="${product.id}">
            <a href="./product-detail.html?slug=${product.slug}" class="product-link">
                <div class="product-image">
                    <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">
                        ${product.price > 0 
                            ? `<span class="price">${formatCurrency(product.price)}</span>` 
                            : '<span class="price contact">Liên hệ</span>'}
                    </div>
                    ${displayRating ? `<div class="product-rating">${renderStars(displayRating)} <span class="rating-value">${displayRating.toFixed(1)}</span> <span class="review-count">(${reviewCount})</span></div>` : ''}
                </div>
            </a>
            <button class="btn-add-cart" onclick="handleAddToCart(${product.id})">
                <span class="material-symbols-outlined">shopping_cart</span>
                Thêm vào giỏ
            </button>
        </div>
    `;
    }).join('');
}

/**
 * Render pagination
 */
function renderPagination() {
    const pagination = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const numbersContainer = document.getElementById('paginationNumbers');
    
    if (!pagination) return;
    
    if (listState.pagination.totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    // Previous button
    prevBtn.disabled = listState.pagination.currentPage === 1;
    
    // Next button
    nextBtn.disabled = listState.pagination.currentPage === listState.pagination.totalPages;
    
    // Page numbers
    const numbers = [];
    const current = listState.pagination.currentPage;
    const total = listState.pagination.totalPages;
    
    // Always show first page
    numbers.push(1);
    
    // Show pages around current
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        if (!numbers.includes(i)) numbers.push(i);
    }
    
    // Always show last page
    if (total > 1 && !numbers.includes(total)) {
        numbers.push(total);
    }
    
    numbersContainer.innerHTML = numbers.map((num, idx) => {
        const prev = numbers[idx - 1];
        const gap = prev && num - prev > 1 ? '<span class="pagination-ellipsis">...</span>' : '';
        return gap + `<button class="pagination-number ${num === current ? 'active' : ''}" data-page="${num}">${num}</button>`;
    }).join('');
}

/**
 * Update product count display
 */
function updateProductCount() {
    const countEl = document.querySelector('.product-count');
    if (countEl) {
        countEl.textContent = `Hiển thị ${listState.displayedProducts.length} sản phẩm`;
    }
}

// ==================== EVENT HANDLERS ====================

/**
 * Handle brand filter click
 */
function handleBrandFilter(brandId, buttonEl) {
    // Accept brand string (or empty)
    const brand = brandId || null;
    listState.filters.brand = brand;

    // Update UI - mirror shop.js: clear then set active on clicked button
    document.querySelectorAll('.brand-filter-btn').forEach(btn => btn.classList.remove('active'));
    if (buttonEl && buttonEl.classList) {
        buttonEl.classList.add('active');
    } else {
        // fallback: mark matching data-brand as active
        document.querySelectorAll('.brand-filter-btn').forEach(btn => {
            if (btn.dataset.brand === (brand || '')) btn.classList.add('active');
        });
    }

    // Reload products from server with brand filter where possible
    (async () => {
        const products = await loadProducts(listState.categorySlug, brand);
        listState.allProducts = products;
        applyFilters();
    })();
}

/**
 * Handle price range filter click
 */
function handlePriceRange(range) {
    listState.filters.priceRange = range;
    
    // Update UI
    document.querySelectorAll('.price-range-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.range === range);
    });
    
    applyFilters();
}

/**
 * Handle sort change
 */
function handleSort(sortValue) {
    listState.filters.sort = sortValue;
    applyFilters();
}

/**
 * Handle page change
 */
function handlePageChange(page) {
    listState.pagination.currentPage = page;
    renderProducts();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Handle add to cart
 */
window.handleAddToCart = async function(productId) {
    const product = listState.allProducts.find(p => p.id === productId);
    if (!product) return;
    
    try {
        const response = await httpRequest(`${API_BASE_URL}/api/cart/add`, {
            method: 'POST',
            body: JSON.stringify({
                productId: product.id,
                quantity: 1
            })
        });
        
        if (response.success) {
            showToast('✅ Đã thêm vào giỏ hàng', 'success');
            // Update cart badge if exists
            const event = new CustomEvent('cartUpdated');
            window.dispatchEvent(event);
        } else {
            throw new Error(response.message || 'Thêm vào giỏ hàng thất bại');
        }
    } catch (error) {
        console.warn('Add to cart failed:', error);
        showToast('⚠️ Vui lòng đăng nhập để thêm vào giỏ hàng', 'warning');
    }
};

// ==================== INITIALIZATION ====================

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Brand filter
    document.getElementById('brandFilters')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.brand-filter-btn');
            if (btn) {
                const brandStr = btn.dataset.brand || '';
                handleBrandFilter(brandStr || null, btn);
            }
    });
    
    // Price range filter
    document.querySelector('.price-range-options')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.price-range-btn');
        if (btn) {
            handlePriceRange(btn.dataset.range);
        }
    });
    
    // Sort select
    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
        handleSort(e.target.value);
    });
    
    // Pagination
    document.getElementById('prevBtn')?.addEventListener('click', () => {
        if (listState.pagination.currentPage > 1) {
            handlePageChange(listState.pagination.currentPage - 1);
        }
    });
    
    document.getElementById('nextBtn')?.addEventListener('click', () => {
        if (listState.pagination.currentPage < listState.pagination.totalPages) {
            handlePageChange(listState.pagination.currentPage + 1);
        }
    });
    
    document.getElementById('paginationNumbers')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.pagination-number');
        if (btn) {
            handlePageChange(parseInt(btn.dataset.page));
        }
    });
}

/**
 * Initialize page
 */
async function initShopList() {
    try {
        // Load sidebar categories
        const categories = await fetch(`${API_BASE_URL}/api/categories`)
            .then(r => r.json())
            .catch(() => Object.entries(CATEGORY_NAMES).map(([slug, name]) => ({ id: 1, name, slug })));
        
        // Render sidebar
        const sidebarNav = document.getElementById('sidebarNav');
        if (sidebarNav) {
            sidebarNav.innerHTML = '<h3 style="padding: 0 12px; margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #333;">Danh mục sản phẩm</h3>';
            categories.forEach(cat => {
                const link = document.createElement('a');
                link.href = `./shop-list.html?category=${cat.slug}`;
                link.textContent = cat.name;
                link.className = 'sidebar-link';
                if (cat.slug === listState.categorySlug) {
                    link.classList.add('active');
                }
                sidebarNav.appendChild(link);
            });
        }
        
        // Get category from URL
        const urlParams = new URLSearchParams(window.location.search);
        listState.categorySlug = urlParams.get('category') || 'laptop-gaming';
        listState.categoryName = CATEGORY_NAMES[listState.categorySlug] || 'Sản phẩm';
        
        // Update page title
        document.title = `${listState.categoryName} - EzGear`;
        document.getElementById('pageTitle').textContent = listState.categoryName;
        
        // Load data in parallel
        const [brands, products] = await Promise.all([
            loadBrands(),
            loadProducts(listState.categorySlug)
        ]);
        
        listState.brands = brands;
        listState.allProducts = products;
        listState.displayedProducts = [...products];
        listState.pagination.totalPages = Math.ceil(products.length / listState.pagination.itemsPerPage);
        
        // Render UI
        renderBrandFilters();
        renderProducts();
        renderPagination();
        updateProductCount();
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('✅ Shop List initialized successfully');
    } catch (error) {
        console.error('❌ Shop List initialization failed:', error);
        showToast('Không thể tải danh sách sản phẩm', 'error');
    }
}

// ==================== START ====================

// Export for use in HTML
window.initShopList = initShopList;
