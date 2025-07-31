const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const port = 3000;
const productsFilePath = path.join(__dirname, 'products.json');

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
    {id: 3, title: 'Men\'s Heritage Denim Jacket', description: 'A timeless staple made from robust, raw denim that ages beautifully. Features classic copper buttons and a fit that gets better with every wear.', price: '4500.00', images: ['https://images.unsplash.com/photo-1543087904-749a173c94aa?q=80&w=1974&auto=format&fit=crop'], category: 'men'},
    {id: 4, title: 'Kids\' Organic Cotton Dino Hoodie', description: 'Let your little one roar in this incredibly soft hoodie, made from GOTS-certified organic cotton. Gentle on the skin and tough enough for playtime.', price: '1899.00', images: ['https://images.unsplash.com/photo-1596871262459-7b3b75a13328?q=80&w=1974&auto=format&fit=crop'], category: 'kids'},
    {id: 5, title: 'Women\'s "Silhouette" High-Waist Trousers', description: 'Define your silhouette with these impeccably tailored high-waist trousers. The premium fabric blend offers structure with a hint of stretch for all-day comfort.', price: '3250.00', images: ['https://images.unsplash.com/photo-1594625849242-9115e3514c33?q=80&w=1974&auto=format&fit=crop'], category: 'women'},
    {id: 6, title: 'Kids\' Cheerful Rainbow Tee', description: 'Dyed with vibrant, lasting colors on pure combed cotton, this t-shirt is designed for smiles and endless days of fun and play.', price: '999.00', images: ['https://images.unsplash.com/photo-1605557582962-370c539828d9?q=80&w=2080&auto=format&fit=crop'], category: 'kids'}
];
const readProductsFromFile = () => { try { if (fs.existsSync(productsFilePath)) { const d = fs.readFileSync(productsFilePath, 'utf-8'); return JSON.parse(d); } return getDefaultProducts(); } catch (e) { console.error(e); return getDefaultProducts(); } };
const writeProductsToFile = (d) => { try { fs.writeFileSync(productsFilePath, JSON.stringify(d, null, 2), 'utf-8'); } catch (e) { console.error(e); } };
let products = readProductsFromFile();

const storage = multer.diskStorage({ destination: path.join(__dirname, 'public', 'uploads'), filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)) });
const upload = multer({ storage, limits: { fileSize: 10000000 }, fileFilter: (req, file, cb) => { const f = /jpeg|jpg|png|gif|webp/; if(f.test(path.extname(file.originalname).toLowerCase()) && f.test(file.mimetype)) return cb(null, true); cb('Error: Images Only!'); } }).array('productImages', 5);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/admin', requireLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === 'sidarth123') {
        req.session.loggedIn = true;
        res.redirect('/admin');
    } else {
        res.send('<script>alert("Incorrect Password!"); window.location.href="/login";</script>');
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) { return res.redirect('/admin'); }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

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
    writeProductsToFile(products);
    res.redirect('/admin');
  });
});

app.delete('/api/products/:id', requireLogin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ message: 'Product not found' });
    products[index].images.forEach(i => { if (i.startsWith('/uploads/')) fs.unlink(path.join(__dirname, 'public', i.substring(1)), e => { if(e) console.error(e); }) });
    products.splice(index, 1);
    writeProductsToFile(products);
    res.status(200).json({ message: 'Product deleted' });
});

app.listen(port, () => {
    if (!fs.existsSync(productsFilePath)) writeProductsToFile(getDefaultProducts());
    console.log(`🚀 Server for Alphonsa Textiles is running on http://localhost:${port}`);
});
