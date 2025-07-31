// --- Checkpoint 1: Server file has started ---
console.log('[DEBUG] server.js execution started.');

require('dotenv').config();

// --- Checkpoint 2: DotEnv loaded ---
console.log('[DEBUG] dotenv configured.');

const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// --- Checkpoint 3: All modules loaded ---
console.log('[DEBUG] All modules loaded.');

// This is a special tool to catch hidden errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('--- 🔴 UNHANDLED REJECTION 🔴 ---');
  console.error('This is the hidden error we were looking for!');
  console.error('Reason:', reason);
});

try {
    cloudinary.config({ 
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
      api_key: process.env.CLOUDINARY_API_KEY, 
      api_secret: process.env.CLOUDINARY_API_SECRET 
    });
    // --- Checkpoint 4: Cloudinary configured ---
    console.log('[DEBUG] Cloudinary configured successfully.');
} catch (e) {
    console.error('--- 🔴 CRITICAL ERROR: Cloudinary configuration failed! 🔴 ---');
    console.error(e);
}

const app = express();
const port = process.env.PORT || 3000;

// --- Checkpoint 5: Express app created ---
console.log('[DEBUG] Express app created.');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });

const ProductSchema = new mongoose.Schema({
  title: String, description: String, price: String, category: String,
  images: [{ url: String, filename: String }]
});
const Product = mongoose.model('Product', ProductSchema);

app.use(session({
  secret: 'alphonsa-textiles-secret-key-for-sidarth',
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

const requireLogin = (req, res, next) => req.session.loggedIn ? next() : res.redirect('/login');

// Change the code to this
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { 
    folder: 'alphonsa-textiles', 
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'avif'] // <-- Add 'avif' here
  }
});
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/admin', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

// API Routes
app.post('/api/login', (req, res) => {
    if (req.body.password === 'sidarth123') {
        req.session.loggedIn = true;
        res.redirect('/admin');
    } else { res.send('<script>alert("Incorrect Password!"); window.location.href="/login";</script>'); }
});
app.get('/api/logout', (req, res) => { req.session.destroy(() => { res.clearCookie('connect.sid'); res.redirect('/'); }); });

app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({}).sort({ _id: -1 });
        const productsWithImageUrls = products.map(p => ({_id: p._id, title: p.title, description: p.description, price: p.price, category: p.category, images: p.images.map(img => img.url)}));
        res.setHeader('Cache-Control', 'no-store').json(productsWithImageUrls);
    } catch (e) { res.status(500).json({ message: 'Error fetching products' }); }
});

app.post('/api/products', requireLogin, upload.array('productImages', 5), async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        newProduct.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
        await newProduct.save();
        res.redirect('/admin');
    } catch (e) { 
        console.error("Error adding product:", e); 
        res.status(500).send('<script>alert("Error adding product."); window.location.href="/admin";</script>'); 
    }
});

app.delete('/api/products/:id', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        for (const image of product.images) { await cloudinary.uploader.destroy(image.filename); }
        res.status(200).json({ message: 'Product deleted' });
    } catch (e) { console.error("Error deleting product:", e); res.status(500).json({ message: 'Error deleting product' }); }
});

// --- Checkpoint 6: About to start the server ---
console.log('[DEBUG] All routes defined. Starting server...');

app.listen(port, () => {
    console.log(`🚀 Server for Alphonsa Textiles is running on http://localhost:${port}`);
});
