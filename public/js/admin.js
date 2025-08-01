document.addEventListener('DOMContentLoaded', () => {
    const adminGrid = document.getElementById('admin-products-grid');

    const fetchAndDisplayProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const products = await res.json();
            
            adminGrid.innerHTML = ''; // Clear existing
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="image-slider">
                        ${product.images.map((image, index) => `
                            <img src="${image.url}" alt="${product.title}" class="slider-image ${index === 0 ? 'active' : ''}" />
                        `).join('')}
                        <button class="slider-btn prev-btn">&lt;</button>
                        <button class="slider-btn next-btn">&gt;</button>
                    </div>
                    <div class="product-info">
                        <h3>${product.title}</h3>
                        <button class="delete-btn" data-id="${product._id}">Delete</button>
                    </div>`;
                adminGrid.appendChild(card);
            });
        } catch (e) {
            console.error("Failed to fetch products for admin:", e);
            adminGrid.innerHTML = "<p>Error loading products.</p>";
        }
    };

    adminGrid.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this product?')) {
                try {
                    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        e.target.closest('.product-card').remove();
                    } else { alert('Failed to delete product.'); }
                } catch (err) { alert('An error occurred during deletion.'); }
            }
        }
    });

    fetchAndDisplayProducts();
});
