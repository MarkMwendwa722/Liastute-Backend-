// dotenv removed
const { sequelize, Category, Product } = require('../models');

const categories = [
  { name: 'Electronics',  slug: 'electronics',  description: 'Gadgets and electronic devices' },
  { name: 'Clothing',     slug: 'clothing',      description: 'Men and women fashion' },
  { name: 'Home & Garden',slug: 'home-garden',   description: 'Furniture, decor, and garden supplies' },
  { name: 'Books',        slug: 'books',         description: 'Fiction, non-fiction, and educational books' },
  { name: 'Sports',       slug: 'sports',        description: 'Sports equipment and accessories' },
];

const products = [
  // Electronics
  {
    name: 'Wireless Bluetooth Headphones',
    slug: 'wireless-bluetooth-headphones',
    description: 'Premium noise-cancelling over-ear headphones with 30-hour battery life.',
    price: 89.99,
    comparePrice: 129.99,
    stock: 50,
    sku: 'ELEC-001',
    categorySlug: 'electronics',
    isFeatured: true,
  },
  {
    name: 'Smart Watch Pro',
    slug: 'smart-watch-pro',
    description: 'Fitness tracker with heart rate monitor, GPS, and 7-day battery.',
    price: 149.99,
    comparePrice: 199.99,
    stock: 30,
    sku: 'ELEC-002',
    categorySlug: 'electronics',
    isFeatured: true,
  },
  {
    name: 'USB-C Charging Hub',
    slug: 'usb-c-charging-hub',
    description: '7-in-1 USB-C hub with HDMI, SD card reader, and 100W PD charging.',
    price: 39.99,
    stock: 100,
    sku: 'ELEC-003',
    categorySlug: 'electronics',
  },
  // Clothing
  {
    name: 'Classic White T-Shirt',
    slug: 'classic-white-t-shirt',
    description: '100% organic cotton unisex t-shirt, available in multiple sizes.',
    price: 19.99,
    stock: 200,
    sku: 'CLO-001',
    categorySlug: 'clothing',
  },
  {
    name: 'Slim Fit Chinos',
    slug: 'slim-fit-chinos',
    description: 'Stretch cotton slim fit chinos, perfect for casual and office wear.',
    price: 49.99,
    comparePrice: 69.99,
    stock: 80,
    sku: 'CLO-002',
    categorySlug: 'clothing',
    isFeatured: true,
  },
  // Home & Garden
  {
    name: 'Ceramic Plant Pot Set',
    slug: 'ceramic-plant-pot-set',
    description: 'Set of 3 modern ceramic pots with drainage holes. Ideal for indoor plants.',
    price: 24.99,
    stock: 60,
    sku: 'HG-001',
    categorySlug: 'home-garden',
  },
  {
    name: 'LED Desk Lamp',
    slug: 'led-desk-lamp',
    description: 'Adjustable color temperature LED desk lamp with USB charging port.',
    price: 34.99,
    comparePrice: 44.99,
    stock: 45,
    sku: 'HG-002',
    categorySlug: 'home-garden',
    isFeatured: true,
  },
  // Books
  {
    name: 'The Art of Clean Code',
    slug: 'the-art-of-clean-code',
    description: 'A practical guide to writing readable, maintainable software.',
    price: 29.99,
    stock: 120,
    sku: 'BK-001',
    categorySlug: 'books',
  },
  {
    name: 'Atomic Habits',
    slug: 'atomic-habits',
    description: 'An easy and proven way to build good habits and break bad ones.',
    price: 14.99,
    comparePrice: 18.99,
    stock: 150,
    sku: 'BK-002',
    categorySlug: 'books',
    isFeatured: true,
  },
  // Sports
  {
    name: 'Resistance Band Set',
    slug: 'resistance-band-set',
    description: 'Set of 5 resistance bands with different tension levels. Perfect for home workouts.',
    price: 22.99,
    stock: 90,
    sku: 'SPT-001',
    categorySlug: 'sports',
  },
  {
    name: 'Yoga Mat Premium',
    slug: 'yoga-mat-premium',
    description: 'Non-slip 6mm thick eco-friendly yoga mat with carry strap.',
    price: 44.99,
    comparePrice: 59.99,
    stock: 70,
    sku: 'SPT-002',
    categorySlug: 'sports',
    isFeatured: true,
  },
];

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Sync tables
    await sequelize.sync({ alter: true });
    console.log('Tables synced.');

    // Seed categories
    console.log('\nSeeding categories...');
    const createdCategories = {};
    for (const cat of categories) {
      const [instance, created] = await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat,
      });
      createdCategories[cat.slug] = instance.id;
      console.log(`  ${created ? 'Created' : 'Exists '} → ${cat.name}`);
    }

    // Seed products
    console.log('\nSeeding products...');
    for (const prod of products) {
      const { categorySlug, ...productData } = prod;
      const categoryId = createdCategories[categorySlug] || null;

      const [, created] = await Product.findOrCreate({
        where: { slug: productData.slug },
        defaults: { ...productData, categoryId },
      });
      console.log(`  ${created ? 'Created' : 'Exists '} → ${productData.name}`);
    }

    console.log('\nSeeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
