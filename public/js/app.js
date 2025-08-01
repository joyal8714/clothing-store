document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const modal = document.getElementById('product-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalImageContainer = document.getElementById('modal-image-container');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalPrice = document.getElementById('modal-price');
    const pageTitle = document.getElementById('page-title');
    const searchInput = document.getElementById('search-input'); // ✅ Add this

    let allProducts = []; // Store all fetched products

    const displayProducts = (productsToDisplay) => {
        productGrid.innerHTML = ''; // Clear existing
        productsToDisplay.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.id = product._id;
            card.innerHTML = `
                <div class="image-slider">
                    ${product.images.map((image, index) => `
                        <img src="${image.url}" alt="${product.title}" class="slider-image ${index === 0 ? 'active' : ''}" />
                    `).join('')}
                    <button class="slider-btn prev-btn" data-action="slide">&lt;</button>
                    <button class="slider-btn next-btn" data-action="slide">&gt;</button>
                </div>
                <div class="product-info">
                    <h3>${product.title}</h3>
                    <p class="price">₹${product.price}</p>
                </div>`;
            productGrid.appendChild(card);
        });
    };

    const fetchAndDisplayProducts = async () => {
        try {
            const res = await fetch('/api/products');
            allProducts = await res.json();
            
            const params = new URLSearchParams(window.location.search);
            const category = params.get('category');

            if (category) {
                const filteredProducts = allProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
                pageTitle.textContent = `Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
                displayProducts(filteredProducts);
            } else {
                pageTitle.textContent = 'Our Latest Collection';
                displayProducts(allProducts);
            }

            // ✅ Attach search listener after rendering products
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    const query = searchInput.value.toLowerCase();
                    const filtered = allProducts.filter(p => p.title.toLowerCase().includes(query));
                    displayProducts(filtered);
                });
            }

        } catch (e) {
            console.error("Failed to fetch products:", e);
            productGrid.innerHTML = "<p>Error loading products.</p>";
        }
    };

    const openModal = (productId) => {
        const product = allProducts.find(p => p._id === productId);
        if (!product) return;

        modalTitle.textContent = product.title;
        modalDescription.textContent = product.description;
        modalPrice.textContent = `₹${product.price}`;
        
        modalImageContainer.innerHTML = `
            <div class="image-slider">
                ${product.images.map((image, index) => `
                    <img src="${image.url}" alt="${product.title}" class="slider-image ${index === 0 ? 'active' : ''}" />
                `).join('')}
                <button class="slider-btn prev-btn">&lt;</button>
                <button class="slider-btn next-btn">&gt;</button>
            </div>`;

        modal.classList.add('show');
    };

    const closeModal = () => {
        modal.classList.remove('show');
    };

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('slider-btn')) {
            const slider = e.target.closest('.image-slider');
            const images = slider.querySelectorAll('.slider-image');
            let activeIndex = Array.from(images).findIndex(img => img.classList.contains('active'));

            images[activeIndex].classList.remove('active');

            if (e.target.classList.contains('next-btn')) {
                activeIndex = (activeIndex + 1) % images.length;
            } else if (e.target.classList.contains('prev-btn')) {
                activeIndex = (activeIndex - 1 + images.length) % images.length;
            }

            images[activeIndex].classList.add('active');
            return;
        }

        const card = e.target.closest('.product-card');
        if (card) {
            openModal(card.dataset.id);
        }
    });

    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    fetchAndDisplayProducts();
});
