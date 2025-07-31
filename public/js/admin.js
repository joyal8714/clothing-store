document.addEventListener('DOMContentLoaded', () => {
    const productsGrid = document.getElementById('current-products-grid');

    const loadProducts = async () => {
        try {
            const res = await fetch(`/api/products?t=${new Date().getTime()}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const products = await res.json();
            displayProducts(products);
        } catch (error) {
            console.error('Error loading products for admin:', error);
            productsGrid.innerHTML = '<p style="color: red;">Could not load products.</p>';
        }
    };

    const displayProducts = (products) => {
        if (!products || products.length === 0) {
            productsGrid.innerHTML = '<p>No products have been added yet.</p>';
            return;
        }
        let productsHTML = '';
        products.forEach(product => {
            const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : 'https://via.placeholder.com/60x60.png?text=No+Img';
            productsHTML += `
                <div class="admin-product-item">
                    <img src="${imageUrl}" alt="${product.title || ''}">
                    <div class="admin-product-info">
                        <h4>${product.title || 'Untitled Product'}</h4>
                        <p>₹${product.price || '0.00'} (${product.category || 'N/A'})</p>
                    </div>
                    <button class="delete-btn" data-id="${product._id}">Delete</button>
                </div>`;
        });
        productsGrid.innerHTML = productsHTML;
    };

    productsGrid.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this product?')) {
                try {
                    const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        loadProducts(); // Reload the list after successful deletion
                    } else {
                        alert('Error deleting product. Please try again.');
                    }
                } catch (error) {
                    console.error('Failed to delete product:', error);
                    alert('An error occurred. Please check the console.');
                }
            }
        }
    });

    loadProducts();
});
