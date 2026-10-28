const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const BASE_URL = 'http://localhost:3000';

const tokens = {
    admin: null,
    ahmed: null,
    sara: null
};

const request = (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = token;

        const req = http.request(
            {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method,
                headers
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    let parsed = data;
                    try {
                        parsed = JSON.parse(data);
                    } catch (e) {}
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                });
            }
        );

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

let passed = 0;
let failed = 0;

const assert = (title, condition, extra = '') => {
    if (condition) {
        console.log(`  \x1b[32m✔ PASS:\x1b[0m ${title}`);
        passed++;
    } else {
        console.log(`  \x1b[31m✖ FAIL:\x1b[0m ${title} ${extra ? `(${extra})` : ''}`);
        failed++;
    }
};

const runAllTests = async () => {
    console.log('\n======================================================');
    console.log('   STARTING FULL SYSTEM END-TO-END TEST SUITE');
    console.log('======================================================\n');

    // Authenticate test users
    const loginAdmin = await request('POST', '/api/v1/auth/login', { email: 'admin@store.com', password: 'admin123456' });
    if (loginAdmin.status === 200) tokens.admin = `Bearer ${loginAdmin.data.data.token}`;

    const loginAhmed = await request('POST', '/api/v1/auth/login', { email: 'ahmed@gmail.com', password: 'user123456' });
    if (loginAhmed.status === 200) tokens.ahmed = `Bearer ${loginAhmed.data.data.token}`;

    const loginSara = await request('POST', '/api/v1/auth/login', { email: 'sara@gmail.com', password: 'user123456' });
    if (loginSara.status === 200) tokens.sara = `Bearer ${loginSara.data.data.token}`;

    let sampleProduct = null;
    let outOfStockProduct = null;

    // ── 1. PUBLIC ROUTES ────────────────────────────────────────────────────────
    console.log('\x1b[36m[1] Testing Public Endpoints & Browsing:\x1b[0m');

    const resProducts = await request('GET', '/api/v1/product');
    assert('GET /api/v1/product returns 200', resProducts.status === 200);
    assert('Returns array of seeded products', Array.isArray(resProducts.data.data) && resProducts.data.data.length > 0);

    sampleProduct = resProducts.data.data.find(p => p.stock > 0);
    outOfStockProduct = resProducts.data.data.find(p => p.stock === 0);

    const resFilter = await request('GET', '/api/v1/product?minPrice=1000&maxPrice=2000');
    assert('Filter products by price range', resFilter.status === 200 && resFilter.data.data.every(p => p.price >= 1000 && p.price <= 2000));

    const resSearch = await request('GET', '/api/v1/product?search=Leather');
    assert('Search products by keyword', resSearch.status === 200 && resSearch.data.data.length > 0);

    const resSlug = await request('GET', `/api/v1/product/${sampleProduct.slug}`);
    assert('GET product by slug returns single item', resSlug.status === 200 && resSlug.data.data.title === sampleProduct.title);

    const resCats = await request('GET', '/api/v1/category');
    assert('GET /api/v1/category returns 200', resCats.status === 200 && resCats.data.data.length >= 3);

    const resFAQs = await request('GET', '/api/v1/faq');
    assert('GET /api/v1/faq returns active questions', resFAQs.status === 200 && resFAQs.data.data.length > 0);

    const resPages = await request('GET', '/api/v1/page/about-us');
    assert('GET /api/v1/page/about-us returns static content', resPages.status === 200 && resPages.data.data.slug === 'about-us');

    // ── 2. AUTHENTICATION & SECURITY ────────────────────────────────────────────
    console.log('\n\x1b[36m[2] Testing Authentication & Security:\x1b[0m');

    const randEmail = `user_${Date.now()}@test.com`;
    const resReg = await request('POST', '/api/v1/auth/register', {
        name: 'New Tester',
        email: randEmail,
        password: 'password123'
    });
    assert('Register new customer returns 201 with token', resReg.status === 201 && resReg.data.data.token);
    assert('Customer role is forced to "user"', resReg.data.data.user.role === 'user');

    const resDup = await request('POST', '/api/v1/auth/register', {
        name: 'Duplicate',
        email: randEmail,
        password: 'password123'
    });
    assert('Duplicate email registration rejected with 400', resDup.status === 400);

    const resBadLogin = await request('POST', '/api/v1/auth/login', {
        email: randEmail,
        password: 'wrong_password'
    });
    assert('Invalid password returns 401 Unauthorized', resBadLogin.status === 401);

    const resGoodLogin = await request('POST', '/api/v1/auth/login', {
        email: randEmail,
        password: 'password123'
    });
    assert('Valid login returns 200 with JWT token', resGoodLogin.status === 200 && resGoodLogin.data.data.token);

    const resNoToken = await request('GET', '/api/v1/user/me');
    assert('Protected route without token rejected with 401', resNoToken.status === 401);

    // ── 3. USER PROFILE & ADDRESS MANAGEMENT ────────────────────────────────────
    console.log('\n\x1b[36m[3] Testing User Profile & Address CRUD:\x1b[0m');

    const resMe = await request('GET', '/api/v1/user/me', null, tokens.ahmed);
    assert('GET /api/v1/user/me with Ahmed token returns profile', resMe.status === 200 && resMe.data.data.email === 'ahmed@gmail.com');
    assert('Ahmed has default address seeded', Array.isArray(resMe.data.data.addresses) && resMe.data.data.addresses.length > 0);

    const resAddAddress = await request(
        'POST',
        '/api/v1/user/addresses',
        { title: 'Summer House', street: 'Marina Gate 4', city: 'North Coast' },
        tokens.ahmed
    );
    assert('Add new address returns 201', resAddAddress.status === 201);
    const newAddressId = resAddAddress.data.data[resAddAddress.data.data.length - 1]._id;

    const resSetDefault = await request('PATCH', `/api/v1/user/addresses/${newAddressId}/default`, null, tokens.ahmed);
    assert('Set address as default works', resSetDefault.status === 200);

    const resDelAddress = await request('DELETE', `/api/v1/user/addresses/${newAddressId}`, null, tokens.ahmed);
    assert('Delete address returns 200', resDelAddress.status === 200);

    // ── 4. CART OPERATIONS & EDGE CASES ─────────────────────────────────────────
    console.log('\n\x1b[36m[4] Testing Cart Flow & Stock Constraints:\x1b[0m');

    await request('DELETE', '/api/v1/cart', null, tokens.ahmed); // clear cart first

    const resAddToCart = await request('POST', '/api/v1/cart/items', { productId: sampleProduct._id, quantity: 2 }, tokens.ahmed);
    assert('Add in-stock product to cart returns 200', resAddToCart.status === 200);

    if (outOfStockProduct) {
        const resAddOOS = await request('POST', '/api/v1/cart/items', { productId: outOfStockProduct._id, quantity: 1 }, tokens.ahmed);
        assert('Prevent Out-of-Stock product from being added (400)', resAddOOS.status === 400);
    }

    const resGetCart = await request('GET', '/api/v1/cart', null, tokens.ahmed);
    assert('GET cart returns calculated total price', resGetCart.status === 200 && resGetCart.data.data.totalPrice > 0);
    assert('Cart items flag hasPriceChanged correctly', resGetCart.data.data.hasPriceChanged === false);

    const resMerge = await request(
        'POST',
        '/api/v1/cart/merge',
        { items: [{ productId: sampleProduct._id, quantity: 1 }] },
        tokens.ahmed
    );
    assert('POST /api/v1/cart/merge increases item quantity', resMerge.status === 200);

    // ── 5. ATOMIC ORDER PLACEMENT & TRANSACTIONS ────────────────────────────────
    console.log('\n\x1b[36m[5] Testing Atomic Order Placement (COD & Mongoose Transaction):\x1b[0m');

    const beforeOrderProduct = await request('GET', `/api/v1/product/${sampleProduct.slug}`);
    const initialStock = beforeOrderProduct.data.data.stock;

    // Reset cart to exactly 1 quantity of sampleProduct
    await request('DELETE', '/api/v1/cart', null, tokens.ahmed);
    await request('POST', '/api/v1/cart/items', { productId: sampleProduct._id, quantity: 1 }, tokens.ahmed);

    const resOrder = await request('POST', '/api/v1/order', {}, tokens.ahmed);
    assert('Place COD order returns 201 Created', resOrder.status === 201 && resOrder.data.data.status === 'pending');
    assert('Order saves addressSnapshot', !!resOrder.data.data.addressSnapshot.street);
    assert('Order saves mobileSnapshot', !!resOrder.data.data.mobileSnapshot);
    assert('Order saves item price snapshot', resOrder.data.data.orderItems[0].price === sampleProduct.price);

    const createdOrderId = resOrder.data.data._id;

    const afterOrderProduct = await request('GET', `/api/v1/product/${sampleProduct.slug}`);
    assert('Atomic transaction: Product stock decreased by 1', afterOrderProduct.data.data.stock === initialStock - 1);

    const resCartAfter = await request('GET', '/api/v1/cart', null, tokens.ahmed);
    assert('Cart is automatically emptied after order', resCartAfter.data.data.items.length === 0);

    // ── 6. ORDER CANCELLATION & STOCK RESTORATION ────────────────────────────────
    console.log('\n\x1b[36m[6] Testing Order Cancellation & Stock Restoration:\x1b[0m');

    const resCancel = await request('PATCH', `/api/v1/order/${createdOrderId}/cancel`, null, tokens.ahmed);
    assert('Client cancels pending order returns 200', resCancel.status === 200 && resCancel.data.data.status === 'cancelled by client');

    const restoredProduct = await request('GET', `/api/v1/product/${sampleProduct.slug}`);
    assert('Stock restored automatically upon cancellation', restoredProduct.data.data.stock === initialStock);

    // ── 7. ADMIN DASHBOARD & CONTROLS ───────────────────────────────────────────
    console.log('\n\x1b[36m[7] Testing Admin Role & Dashboard Stats:\x1b[0m');

    const resAdminForbidden = await request('GET', '/api/v1/dashboard/stats', null, tokens.ahmed);
    assert('Customer cannot access Admin Dashboard (403 Forbidden)', resAdminForbidden.status === 403);

    const resStats = await request('GET', '/api/v1/dashboard/stats', null, tokens.admin);
    assert('Admin access to /dashboard/stats returns 200', resStats.status === 200);
    assert('Stats include outOfStockCount alert', typeof resStats.data.data.alerts.outOfStockCount === 'number');
    assert('Stats include lowStockProducts list (<= 3 stock)', Array.isArray(resStats.data.data.alerts.lowStockProducts));

    const resAllOrders = await request('GET', '/api/v1/order', null, tokens.admin);
    assert('Admin GET all orders returns list', resAllOrders.status === 200 && Array.isArray(resAllOrders.data.data));

    const resUpdateStatus = await request('PATCH', `/api/v1/order/${createdOrderId}/status`, { status: 'preparing' }, tokens.admin);
    assert('Admin updates order status to "preparing"', resUpdateStatus.status === 200 && resUpdateStatus.data.data.status === 'preparing');

    const resTestimonials = await request('GET', '/api/v1/testimonial/all', null, tokens.admin);
    assert('Admin reviews all testimonials', resTestimonials.status === 200 && resTestimonials.data.data.length > 0);

    // ── SUMMARY ─────────────────────────────────────────────────────────────────
    console.log('\n======================================================');
    console.log(`TEST RESULTS: \x1b[32m${passed} PASSED\x1b[0m, \x1b[31m${failed} FAILED\x1b[0m`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
};

runAllTests().catch((err) => {
    console.error('Fatal error during test run:', err);
    process.exit(1);
});

