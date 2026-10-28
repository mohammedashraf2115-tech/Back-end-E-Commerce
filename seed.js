const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const User = require('./model/user.model');
const Category = require('./model/category.model');
const Subcategory = require('./model/subcategory.model');
const Product = require('./model/product.model');
const FAQ = require('./model/faq.model');
const Testimonial = require('./model/testimonial.model');
const Page = require('./model/page.model');
const Cart = require('./model/cart.model');
const Order = require('./model/order.model');

const generateToken = (user) => {
    return jwt.sign(
        { _id: user._id, role: user.role, name: user.name },
        process.env.SECRET_KEY,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        await Promise.all([
            User.deleteMany(),
            Category.deleteMany(),
            Subcategory.deleteMany(),
            Product.deleteMany(),
            FAQ.deleteMany(),
            Testimonial.deleteMany(),
            Page.deleteMany(),
            Cart.deleteMany(),
            Order.deleteMany()
        ]);
        console.log('Database cleared.');

        const admin = await User.create({
            name: 'Store Admin',
            email: 'admin@store.com',
            password: 'admin123456',
            role: 'admin',
            mobile: '01011112222'
        });

        const user1 = await User.create({
            name: 'Ahmed Hassan',
            email: 'ahmed@gmail.com',
            password: 'user123456',
            role: 'user',
            mobile: '01122223333',
            addresses: [
                {
                    title: 'Home',
                    street: '15 El-Tahrir Street',
                    city: 'Cairo',
                    isDefault: true
                },
                {
                    title: 'Work',
                    street: 'Building 4, Smart Village',
                    city: 'Giza',
                    isDefault: false
                }
            ]
        });

        const user2 = await User.create({
            name: 'Sara Mohamed',
            email: 'sara@gmail.com',
            password: 'user123456',
            role: 'user',
            mobile: '01233334444',
            addresses: [
                {
                    title: 'Home',
                    street: '22 Corniche El Nile',
                    city: 'Alexandria',
                    isDefault: true
                }
            ]
        });

        console.log('Users created.');

        const catBriefcases = await Category.create({ name: 'Briefcases & Laptop Bags', slug: 'briefcases-laptop-bags' });
        const catBackpacks = await Category.create({ name: 'Backpacks & Travel', slug: 'backpacks-travel' });
        const catMessengers = await Category.create({ name: 'Crossbody & Messengers', slug: 'crossbody-messengers' });

        const subLeatherBrief = await Subcategory.create({ name: 'Leather Briefcases', slug: 'leather-briefcases', categoryId: catBriefcases._id });
        const subDocCases = await Subcategory.create({ name: 'Document Cases', slug: 'document-cases', categoryId: catBriefcases._id });
        const subLaptopPack = await Subcategory.create({ name: 'Laptop Backpacks', slug: 'laptop-backpacks', categoryId: catBackpacks._id });
        const subTravelPack = await Subcategory.create({ name: 'Travel Daypacks', slug: 'travel-daypacks', categoryId: catBackpacks._id });
        const subLeatherMess = await Subcategory.create({ name: 'Leather Messengers', slug: 'leather-messengers', categoryId: catMessengers._id });
        const subExecWork = await Subcategory.create({ name: 'Executive Workbags', slug: 'executive-workbags', categoryId: catMessengers._id });

        console.log('Categories and subcategories created.');

        const sampleImages = [
            'product_1.jpg',
            'product_2.jpg',
            'product_3.jpg',
            'product_4.jpg',
            'product_5.jpg',
            'product_6.jpg',
            'product_7.jpg',
            'product_8.jpg',
            'product_9.jpg',
            'product_10.jpg',
            'product_11.jpg',
            'product_12.jpg'
        ];

        const products = await Product.create([
            {
                title: 'Executive Black Leather Messenger Bag',
                description: 'Premium handcrafted black leather messenger bag featuring an executive cyan accent stripe and padded shoulder strap.',
                price: 1450,
                stock: 15,
                categoryId: catMessengers._id,
                subcategoryId: subLeatherMess._id,
                slug: 'executive-black-leather-messenger-bag',
                image: sampleImages[0]
            },
            {
                title: 'Classic Tan Leather Laptop Briefcase',
                description: 'Slim-profile genuine tan leather briefcase designed for up to 15.6-inch laptops with dedicated document compartments.',
                price: 1850,
                stock: 8,
                categoryId: catBriefcases._id,
                subcategoryId: subLeatherBrief._id,
                slug: 'classic-tan-leather-laptop-briefcase',
                image: sampleImages[1]
            },
            {
                title: 'Chestnut Heritage Leather Case',
                description: 'Artisan-crafted chestnut leather case featuring solid metal hardware and reinforced dual carry handles.',
                price: 1950,
                stock: 5,
                categoryId: catBriefcases._id,
                subcategoryId: subDocCases._id,
                slug: 'chestnut-heritage-leather-case',
                image: sampleImages[2]
            },
            {
                title: 'Urban Waterproof Tech Backpack',
                description: 'Ergonomic multi-pocket commuter and travel backpack with USB charging port and anti-theft laptop compartment.',
                price: 1100,
                stock: 25,
                categoryId: catBackpacks._id,
                subcategoryId: subLaptopPack._id,
                slug: 'urban-waterproof-tech-backpack',
                image: sampleImages[3]
            },
            {
                title: 'Vintage Camel Business Briefcase',
                description: 'Timeless camel brown leather briefcase with brass zipper accents and spacious interior organizers for professionals.',
                price: 1750,
                stock: 12,
                categoryId: catBriefcases._id,
                subcategoryId: subLeatherBrief._id,
                slug: 'vintage-camel-business-briefcase',
                image: sampleImages[4]
            },
            {
                title: 'Artisan Leather Document Bag',
                description: 'Elegant soft-finish leather document carrier with detachable cross-body strap, perfect for daily office essentials.',
                price: 1600,
                stock: 2,
                categoryId: catBriefcases._id,
                subcategoryId: subDocCases._id,
                slug: 'artisan-leather-document-bag',
                image: sampleImages[5]
            },
            {
                title: 'Signature Leather Travel Portfolio',
                description: 'Exclusive artisan leather portfolio bag with secure dual-zip closure, scratch-resistant finish, and refined detailing.',
                price: 1800,
                stock: 0,
                categoryId: catMessengers._id,
                subcategoryId: subExecWork._id,
                slug: 'signature-leather-travel-portfolio',
                image: sampleImages[6]
            },
            {
                title: 'Modern Commuter Daily Backpack',
                description: 'Lightweight high-density ballistic fabric daypack with breathable back padding and quick-access utility pockets.',
                price: 1250,
                stock: 18,
                categoryId: catBackpacks._id,
                subcategoryId: subLaptopPack._id,
                slug: 'modern-commuter-daily-backpack',
                image: sampleImages[7]
            },
            {
                title: 'Royal Oxford Leather Messenger',
                description: 'Sleek professional leather messenger bag engineered for seamless transitions between client meetings and travel.',
                price: 1650,
                stock: 7,
                categoryId: catMessengers._id,
                subcategoryId: subLeatherMess._id,
                slug: 'royal-oxford-leather-messenger',
                image: sampleImages[8]
            },
            {
                title: 'Slim Executive Tan Workbag',
                description: 'Minimalist luxury workbag with structured silhouette, fine contrast stitching, and reinforced corners for longevity.',
                price: 1900,
                stock: 3,
                categoryId: catBriefcases._id,
                subcategoryId: subLeatherBrief._id,
                slug: 'slim-executive-tan-workbag',
                image: sampleImages[9]
            },
            {
                title: 'Nomad Explorer Travel Daypack',
                description: 'Heavy-duty weatherproof adventure daypack featuring shockproof laptop protection and ergonomic luggage trolley strap.',
                price: 1350,
                stock: 10,
                categoryId: catBackpacks._id,
                subcategoryId: subTravelPack._id,
                slug: 'nomad-explorer-travel-daypack',
                image: sampleImages[10]
            },
            {
                title: 'Vintage Tuscan Leather Attache',
                description: 'Distinctive Tuscan-inspired pull-up leather attache that develops a unique, rich patina over years of use.',
                price: 2100,
                stock: 4,
                categoryId: catBriefcases._id,
                subcategoryId: subDocCases._id,
                slug: 'vintage-tuscan-leather-attache',
                image: sampleImages[11]
            }
        ]);

        console.log('Products created.');

        await FAQ.create([
            {
                question: 'What payment methods do you support?',
                answer: 'We currently support Cash on Delivery (COD) for all orders across Egypt.',
                isActive: true
            },
            {
                question: 'How long does shipping take?',
                answer: 'Standard shipping takes 2 to 4 business days depending on your city.',
                isActive: true
            },
            {
                question: 'Can I open and inspect the package before paying?',
                answer: 'Yes, you can inspect your items with the courier before making payment.',
                isActive: true
            },
            {
                question: 'What is your return policy?',
                answer: 'You can return or exchange any unworn item within 14 days of receipt.',
                isActive: true
            }
        ]);

        console.log('FAQs created.');

        await Testimonial.create([
            {
                userId: user1._id,
                message: 'Excellent quality fabrics and super fast delivery. Highly recommended!',
                rating: 5,
                status: 'approved'
            },
            {
                userId: user2._id,
                message: 'Loved the dress, fits perfectly and the material is top notch.',
                rating: 5,
                status: 'approved'
            },
            {
                userId: user1._id,
                message: 'Great customer service and polite couriers.',
                rating: 4,
                status: 'pending'
            }
        ]);

        console.log('Testimonials created.');

        await Page.create([
            {
                title: 'About Us',
                slug: 'about-us',
                content: 'Welcome to our online clothing store. We are dedicated to providing the highest quality fashion with effortless ordering and fast cash-on-delivery service.'
            },
            {
                title: 'Contact Us',
                slug: 'contact-us',
                content: 'Need assistance? Reach out to us via WhatsApp at +201011112222 or email us at support@store.com. Our support team is available from 9 AM to 9 PM daily.'
            },
            {
                title: 'Return and Exchange Policy',
                slug: 'policies',
                content: 'Items can be returned or exchanged within 14 days of delivery provided they are in original unworn condition with tags attached.'
            }
        ]);

        console.log('Pages created.');

        const adminToken = generateToken(admin);
        const user1Token = generateToken(user1);
        const user2Token = generateToken(user2);

        const credentialsText = `========================================================================
E-COMMERCE PRODUCTION CREDENTIALS & ACTIVE TOKENS
Generated At: ${new Date().toISOString()}
========================================================================

1. ADMIN ACCOUNT
-----------------
Name:     ${admin.name}
Email:    ${admin.email}
Password: admin123456
Role:     admin
Token (Valid for 7 days):
Bearer ${adminToken}


2. CUSTOMER ACCOUNT 1 (Ahmed Hassan - has 2 addresses & mobile)
---------------------------------------------------------------
Name:     ${user1.name}
Email:    ${user1.email}
Password: user123456
Role:     user
Mobile:   ${user1.mobile}
Default Address: 15 El-Tahrir Street, Cairo
Token (Valid for 7 days):
Bearer ${user1Token}


3. CUSTOMER ACCOUNT 2 (Sara Mohamed - has 1 address & mobile)
--------------------------------------------------------------
Name:     ${user2.name}
Email:    ${user2.email}
Password: user123456
Role:     user
Mobile:   ${user2.mobile}
Default Address: 22 Corniche El Nile, Alexandria
Token (Valid for 7 days):
Bearer ${user2Token}


4. SAMPLE TEST PRODUCTS READY FOR TESTING
-----------------------------------------
- Regular Stock:     "Classic White Cotton T-Shirt" (Stock: 25) - Price: 350 EGP
- Low Stock Alert:   "Winter Leather Jacket" (Stock: 2) -> Shows "Only 2 left"
- Low Stock Alert:   "Oversized Graphic Tee" (Stock: 1) -> Shows "Only 1 left"
- Low Stock Alert:   "Casual Linen Shirt" (Stock: 3) -> Shows "Only 3 left"
- Out of Stock:      "Silk Evening Blouse" (Stock: 0) -> Disabled / Out of Stock


5. QUICK API CURL TEST
-----------------------
curl -X GET http://localhost:3000/api/v1/product
curl -X GET http://localhost:3000/api/v1/user/me -H "Authorization: Bearer ${adminToken}"
curl -X GET http://localhost:3000/api/v1/dashboard/stats -H "Authorization: Bearer ${adminToken}"
========================================================================
`;

        fs.writeFileSync(path.join(__dirname, 'CREDENTIALS_AND_TOKENS.txt'), credentialsText);

        console.log('\n========================================');
        console.log('SEEDING COMPLETED SUCCESSFULLY!');
        console.log('Credentials and active tokens saved to: CREDENTIALS_AND_TOKENS.txt');
        console.log('========================================\n');

        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seed();

