const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
// Render provides the PORT environment variable.
const port = process.env.PORT || 3000; 

// --- CHANGE #1: Define the path to the persistent disk ---
// This is the special folder where Render will save our data permanently.
const persistentDataPath = '/var/data';
const productsFilePath = path.join(persistentDataPath, 'products.json');
const uploadsPath = path.join(persistentDataPath, 'uploads');

// --- Create the uploads directory on the disk if it doesn't exist ---
// This ensures our image upload folder is always available.
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(session({
  secret: 'alphonsa-textiles-secret-key-sidarth',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

const requireLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
};

const getDefaultProducts = () => [
    {id: 1, title: 'Men\'s Linen Comfort Shirt', description: 'Experience pure comfort with our 100% breathable linen shirt. Perfectly tailored for a relaxed yet sharp look, ideal for warm days and effortless style.', price: '2499.00', images: ['https://images.unsplash.com/photo-1618220883196-3c4234257125?q=80&w=1974&auto=format&fit=crop'], category: 'men'},
    {id: 2, title: 'Women\'s "Elegance" Silk Gown', description: 'Crafted from the finest mulberry silk, this gown features a luxurious drape that flows with every step. Its subtle sheen makes it perfect for evening events.', price: '7999.00', images: ['https://images.unsplash.com/photo-1595911475066-d44fab89e2d7?q=80&w=1974&auto=format&fit=crop'], category: 'women'},
    {id: 3, title: 'Men\'s Heritage Denim Jacket', description: 'A timeless staple made from robust, raw denim that ages beautifully. Features classic copper buttons and a fit that gets better with every wear.', price: '4500.00', images: ['https://images.unsplash.com/photo-1543087904-749a173c94aa?q=80&w=1974&auto=format&fit=crop'], category: 'men'}
];
const readProductsFromFile = () => { try { if (fs.existsSync(productsFilePath)) { const d = fs.readFileSync(productsFilePath, 'utf-8'); return JSON.parse(d); } return getDefaultProducts(); } catch (e) { console.error("Error reading products file:", e); return getDefaultProducts(); } };
const writeProductsToFile = (d) => { try { fs.writeFileSync(productsFilePath, JSON.stringify(d, null, 2), 'utf-8'); } catch (e) { console.error("Error writing products file:", e); } };
let products = readProductsFromFile();

// --- CHANGE #2: Update Multer to save to the persistent disk ---
const storage = multer.diskStorage({
  destination: uploadsPath, // Use the new persistent path
  filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10000000 }, fileFilter: (req, file, cb) => { const f = /jpeg|jpg|png|gif|webp/; if(f.test(path.extname(file.originalname).toLowerCase()) && f.test(file.mimetype)) return cb(null, true); cb('Error: Images Only!'); } }).array('productImages', 5);

// --- CHANGE #3: Serve the uploaded images statically from the disk ---
app.use('/uploads', express.static(uploadsPath));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/admin', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

app.post('/api/login', (req, res) => {
    if (req.body.password === 'sidarth123') {
        req.session.loggedIn = true;
        res.redirect('/admin');
    } else {
        res.send('<script>alert("Incorrect Password!"); window.location.href="/login";</script>');
    }
});
app.get('/api/logout', (req, res) => { req.session.destroy(() => { res.clearCookie('connect.sid'); res.redirect('/'); }); });

app.get('/api/products', (req, res) => {
    const p = products.map(pr => ({ ...pr, images: pr.images.map(i => i.startsWith('/uploads/') ? `${req.protocol}://${req.get('host')}${i}` : i) }));
    res.setHeader('Cache-Control', 'no-store').json(p);
});

app.post('/api/products', requireLogin, (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).send(`<script>alert("Upload Error: ${err.message || err}"); window.location.href="/admin";</script>`);
    const { title, description, price, category } = req.body;
    if (!title || !description || !price || !category || !req.files || req.files.length === 0) return res.status(400).send('<script>alert("Submission Error: All fields and an image are required."); window.location.href="/admin";</script>');
    const maxId = products.reduce((m, p) => p.id > m ? p.id : m, 0);
    const newProduct = { id: maxId + 1, title, description, price, category, images: req.files.map(f => `/uploads/${f.filename}`) };
    products.push(newProduct);
    writeProductsToFile(products); // SAVE TO FILE!
    res.redirect('/admin');
  });
});

app.delete('/api/products/:id', requireLogin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ message: 'Product not found' });
    products[index].images.forEach(i => { if (i.startsWith('/uploads/')) fs.unlink(path.join(uploadsPath, path.basename(i)), e => { if(e) console.error("Failed to delete image file:", e); }) });
    products.splice(index, 1);
    writeProductsToFile(products); // SAVE TO FILE!
    res.status(200).json({ message: 'Product deleted' });
});

app.listen(port, () => {
    if (!fs.existsSync(productsFilePath)) {
        writeProductsToFile(getDefaultProducts());
    }
    console.log(`🚀 Server for Alphonsa Textiles is running on http://localhost:${port}`);
});
