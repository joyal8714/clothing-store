document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const pageTitle = document.getElementById('page-title');
    const modal = document.getElementById('product-modal');
    let allProducts = [];

    const loadProducts = async () => {
        try {
            // Use a cache-busting parameter to ensure we always get fresh data
            const res = await fetch(`/api/products?t=${new Date().getTime()}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            allProducts = await res.json();
            
            const params = new URLSearchParams(window.location.search);
            const category = params.get('category');
            
            displayProducts(category);
        } catch (error) {
            console.error('Failed to load products:', error);
            productGrid.innerHTML = '<p style="color: red;">Error: Could not load products. Please try again later.</p>';
        }
    };

    const displayProducts = (category) => {
        let productsToDisplay = allProducts;

        if (category) {
            productsToDisplay = allProducts.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
            pageTitle.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)}'s Collection`;
        } else {
            pageTitle.textContent = 'Our Latest Collection';
        }
        
        productGrid.innerHTML = '';
        if (productsToDisplay.length === 0) {
            productGrid.innerHTML = '<p>No products found in this collection yet.</p>';
            return;
        }

        productsToDisplay.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.productId = product._id; // Use _id from MongoDB
            
            // Defensive check for images array
            const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : 'https://via.placeholder.com/380x380.png?text=No+Image';

            card.innerHTML = `
                <img src="${imageUrl}" alt="${product.title}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.title || 'Untitled Product'}</h3>
                    <p class="product-description">${(product.description || '').substring(0, 100)}...</p>
                    <div class="product-footer">
                        <span class="product-price">₹${product.price || '0.00'}</span>
                    </div>
                </div>
            `;
            card.addEventListener('click', () => openModal(product._id));
            productGrid.appendChild(card);
        });
    };

    const modalImageSlider = document.getElementById('modal-image-slider'), modalTitle = document.getElementById('modal-title'), modalDescription = document.getElementById('modal-description'), modalPrice = document.getElementById('modal-price');
    let currentImageIndex = 0, currentImages = [];

    const openModal = (productId) => {
        const product = allProducts.find(p => p._id === productId);
        if (!product) return;
        currentImages = product.images || [];
        currentImageIndex = 0;
        modalTitle.textContent = product.title;
        modalDescription.textContent = product.description;
        modalPrice.textContent = `₹${product.price}`;
        updateSlider();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => { modal.style.display = 'none'; document.body.style.overflow = 'auto'; };
    const updateSlider = () => {
        modalImageSlider.innerHTML = currentImages.map(src => `<img src="${src}" alt="${modalTitle.textContent}">`).join('');
        modalImageSlider.style.transform = `translateX(-${currentImageIndex * 100}%)`;
        document.getElementById('slider-prev-btn').style.display = currentImages.length > 1 ? 'block' : 'none';
        document.getElementById('slider-next-btn').style.display = currentImages.length > 1 ? 'block' : 'none';
    };
    const showNextImage = () => { currentImageIndex = (currentImageIndex + 1) % currentImages.length; updateSlider(); };
    const showPrevImage = () => { currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length; updateSlider(); };

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => e.target === modal && closeModal());
    document.getElementById('slider-next-btn').addEventListener('click', showNextImage);
    document.getElementById('slider-prev-btn').addEventListener('click', showPrevImage);
    document.addEventListener('keydown', (e) => { if (modal.style.display === 'flex') { if (e.key === 'Escape') closeModal(); if (e.key === 'ArrowRight') showNextImage(); if (e.key === 'ArrowLeft') showPrevImage(); } });
    
    loadProducts();
});
