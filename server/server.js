const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Import CORS

const app = express();
const port = 3000;

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// --- In-memory storage with categories ---
let products = [
    {id: 1, title: 'Men\'s Urban Explorer Tee', description: 'A comfortable and stylish tee for your daily adventures.', price: '29.99', images: ['/img/men-tee.jpg'], category: 'men'},
    {id: 2, title: 'Women\'s Midnight Flow Dress', description: 'An elegant black dress, perfect for evening events.', price: '120.00', images: ['/img/women-dress.jpg'], category: 'women'},
    {id: 3, title: 'Men\'s Classic Denim Jacket', description: 'A timeless denim jacket for all seasons.', price: '89.99', images: ['/img/men-jacket.jpg'], category: 'men'},
    {id: 4, title: 'Kids\' Dino-Mite Hoodie', description: 'A fun and cozy hoodie for the little adventurer.', price: '45.00', images: ['/img/kids-hoodie.jpg'], category: 'kids'},
    {id: 5, title: 'Women\'s High-Waist Jeans', description: 'Flattering high-waist jeans made with premium stretch denim.', price: '75.50', images: ['/img/women-jeans.jpg'], category: 'women'},
    {id: 6, title: 'Kids\' Rainbow T-Shirt', description: 'A bright and cheerful t-shirt for everyday play.', price: '19.99', images: ['/img/kids-tee.jpg'], category: 'kids'}
];
let nextId = 7;

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).array('productImages', 5);

function checkFileType(file, cb){
  const filetypes = /jpeg|jpg|png|gif|webp/;
  if(filetypes.test(path.extname(file.originalname).toLowerCase()) && filetypes.test(file.mimetype)) {
    return cb(null, true);
  }
  cb('Error: Images Only!');
}

// --- API ROUTES ---
app.get('/api/products', (req, res) => {
    // Modify image paths to be full URLs for the client
    const productsWithFullPaths = products.map(p => ({
        ...p,
        images: p.images.map(img => {
            return img.startsWith('/uploads/') 
                ? `http://localhost:${port}${img}` 
                : img // Keep placeholder paths as is (assuming client has them)
        })
    }));
    res.json(productsWithFullPaths);
});

app.post('/api/products', (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || err });
    
    const { title, description, price, category } = req.body;
    if (!title || !description || !price || !category || !req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'All fields and at least one image are required.' });
    }

    const newProduct = {
      id: nextId++,
      title, description, price, category,
      images: req.files.map(file => `/uploads/${file.filename}`)
    };
    products.push(newProduct);
    console.log('Product added:', newProduct.title);
    res.status(201).json(newProduct);
  });
});

app.delete('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id, 10);
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return res.status(404).json({ message: 'Product not found' });

    const productToDelete = products[productIndex];
    productToDelete.images.forEach(imagePath => {
        if (imagePath.startsWith('/uploads/')) {
            const fullPath = path.join(__dirname, 'public', imagePath);
            fs.unlink(fullPath, (err) => {
                if (err) console.error(`Failed to delete image: ${fullPath}`, err);
            });
        }
    });

    products.splice(productIndex, 1);
    console.log(`Product with ID ${productId} deleted.`);
    res.status(200).json({ message: 'Product deleted successfully' });
});

app.listen(port, () => console.log(`🚀 API Server running on http://localhost:${port}`));
