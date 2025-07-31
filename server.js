const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose'); // For MongoDB
const cloudinary = require('cloudinary').v2; // For Cloudinary
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Helper

// --- IMPORTANT: Configure Cloudinary from Environment Variables ---
// The code securely reads your secret keys from the hosting environment.
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const app = express();
const port = process.env.PORT || 3000;

// --- Connect to MongoDB using the Environment Variable ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully...'))
  .catch(err => console.log('MongoDB connection error:', err));

// --- Define a Schema and Model for Products ---
const ProductSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: String,
  category: String,
  images: [{
    url: String,
    filename: String
  }]
});
const Product = mongoose.model('Product', ProductSchema);

// --- Session Middleware ---
app.use(session({
  secret: 'alphonsa-textiles-secret-key-for-sidarth',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

const requireLogin = (req, res, next) => req.session.loggedIn ? next() : res.redirect('/login');

// --- Configure Multer to upload to Cloudinary ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'alphonsa-textiles',
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp']
  }
});
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// HTML Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/admin', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

// AUTH API
app.post('/api/login', (req, res) => {
    if (req.body.password === 'sidarth123') {
        req.session.loggedIn = true;
        res.redirect('/admin');
    } else {
        res.send('<script>alert("Incorrect Password!"); window.location.href="/login";</script>');
    }
});
app.get('/api/logout', (req, res) => { req.session.destroy(() => { res.clearCookie('connect.sid'); res.redirect('/'); }); });

// PRODUCT API (using MongoDB)
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({}).sort({ _id: -1 }); // Sort by newest first
        const productsWithImageUrls = products.map(p => ({
            _id: p._id,
            title: p.title,
            description: p.description,
            price: p.price,
            category: p.category,
            images: p.images.map(img => img.url)
        }));
        res.setHeader('Cache-Control', 'no-store').json(productsWithImageUrls);
    } catch (e) { res.status(500).json({ message: 'Error fetching products' }); }
});

app.post('/api/products', requireLogin, upload.array('productImages', 5), async (req, res) => {
    try {
        const { title, description, price, category } = req.body;
        const newProduct = new Product({ title, description, price, category });
        newProduct.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
        await newProduct.save();
        res.redirect('/admin');
    } catch (e) { console.error("Error adding product:", e); res.status(500).send("Error adding product"); }
});

app.delete('/api/products/:id', requireLogin, async (req, res) => {
    try {
        const { id } = req.params;
        const productToDelete = await Product.findById(id);
        if (!productToDelete) return res.status(404).json({ message: 'Product not found' });
        
        for (let image of productToDelete.images) {
            await cloudinary.uploader.destroy(image.filename);
        }
        
        await Product.findByIdAndDelete(id);
        res.status(200).json({ message: 'Product deleted' });
    } catch (e) { console.error("Error deleting product:", e); res.status(500).json({ message: 'Error deleting product' }); }
});

app.listen(port, () => {
    console.log(`🚀 Server for Alphonsa Textiles is running on http://localhost:${port}`);
});
