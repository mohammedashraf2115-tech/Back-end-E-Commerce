# 🛍️ L'ATELIER E-Commerce REST API

> A robust, secure, and production-grade RESTful API for a luxury leather goods e-commerce platform. Built with Node.js, Express, MongoDB, and Mongoose.

---

## 🌟 Key Features

* **Authentication & Authorization:**
  * JWT-based authentication with bcrypt password hashing.
  * Role-Based Access Control (`user` vs `admin`) with custom middleware guards.
  * Client profile management and address book CRUD.
* **Catalog & Inventory Architecture:**
  * Rich product schema with categories, subcategories, stock tracking, and slug-based routing.
  * Search, multi-criteria filtering (price, category), sorting, and pagination.
  * Static file serving for high-resolution product imagery.
* **Cart & Guest Cart System:**
  * Server-side cart with automatic price change detection (`hasPriceChanged`).
  * Guest-to-authenticated cart merging upon login.
* **Order & Transaction Management:**
  * Cash on Delivery (COD) payment protocol across Egypt.
  * Atomic stock reduction using Mongoose transactions upon checkout.
  * Order status lifecycle: `pending` ➔ `preparing` ➔ `shipped` ➔ `delivered` ➔ `cancelled`.
  * Automatic inventory restoration on client/admin order cancellation.
* **Admin Dashboard & Analytics:**
  * High-level business metrics (Total Revenue, Pending Orders count).
  * Real-time inventory alerts: Low Stock Alert (≤ 3 items) and Out of Stock tracking.
  * Full order fulfillment control.
* **Security & Production Hardening:**
  * Helmet security headers, CORS protection, and Rate Limiting.
  * Winston structured file & console logging with request timestamps.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js (v18+)
* **Framework:** Express.js 5
* **Database:** MongoDB with Mongoose ODM
* **Security:** JSON Web Tokens (JWT), bcrypt, helmet, express-rate-limit
* **Logging:** Winston logger
* **Testing:** Custom end-to-end integration test runner (39/39 passing tests)

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18 or higher)
* MongoDB running locally on `mongodb://localhost:27017` (or MongoDB Atlas connection string)

### 2. Installation
```bash
cd E-Commerce
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (or copy `.env.example`):
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/ecommerce
SECRET_KEY=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 4. Database Seeding
Seed the database with sample luxury leather products, categories, FAQs, admin, and test users:
```bash
node seed.js
```

### 5. Running the API
```bash
# Start in development mode with nodemon
npm run dev

# Or start directly
node index.js
```
The API server will listen on `http://localhost:3000`.

---

## 👥 Demo & Test Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@store.com` | `admin123456` | Full Admin Dashboard, Inventory & Orders Management |
| **Customer** | `ahmed@gmail.com` | `user123456` | Shopping Bag, Address Book, Checkout, Order Archive |
| **Customer 2** | `sara@gmail.com` | `user123456` | Standard Customer Account |

---

## 🧪 Automated End-to-End Tests
Run the comprehensive test suite verifying 39 business logic assertions:
```bash
node test-all.js
```
Output: `TEST RESULTS: 39 PASSED, 0 FAILED`

---

## 📄 License
This project is open-source under the [ISC License](LICENSE).

