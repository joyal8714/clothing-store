import React, { useState, useEffect, useCallback } from 'react';

const API_URL = 'http://localhost:3000/api/products';

const AdminPage = () => {
    const [products, setProducts] = useState([]);
    const [formState, setFormState] = useState({ title: '', description: '', price: '', category: 'men' });
    const [files, setFiles] = useState([]);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            setProducts(data.sort((a, b) => b.id - a.id));
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleInputChange = (e) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(formState).forEach(key => formData.append(key, formState[key]));
        for (let i = 0; i < files.length; i++) {
            formData.append('productImages', files[i]);
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add product');
            }
            // Reset form and refetch products
            e.target.reset();
            setFiles([]);
            setFormState({ title: '', description: '', price: '', category: 'men' });
            fetchProducts();
        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error('Failed to add product:', error);
        }
    };
    
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete product');
            }
            fetchProducts();
        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error('Failed to delete product:', error);
        }
    };

    return (
        <div className="container">
            <div className="admin-container">
                <div className="admin-form-container fade-in">
                    <h2>Add New Product</h2>
                    <form onSubmit={handleSubmit} className="admin-form">
                        <div className="form-group"><label htmlFor="title">Product Title</label><input type="text" id="title" name="title" onChange={handleInputChange} required /></div>
                        <div className="form-group"><label htmlFor="description">Product Description</label><textarea id="description" name="description" onChange={handleInputChange} required rows="4"></textarea></div>
                        <div className="form-group"><label htmlFor="price">Price (USD)</label><input type="number" id="price" name="price" step="0.01" onChange={handleInputChange} required /></div>
                        <div className="form-group"><label htmlFor="category">Category</label><select id="category" name="category" onChange={handleInputChange} required><option value="men">Men</option><option value="women">Women</option><option value="kids">Kids</option></select></div>
                        <div className="form-group"><label htmlFor="productImages">Product Images (up to 5)</label><input type="file" id="productImages" name="productImages" onChange={handleFileChange} multiple required /></div>
                        <button type="submit" className="submit-btn">Add Product</button>
                    </form>
                </div>
                <div className="admin-products-list fade-in">
                    <h2>Current Products</h2>
                    <div id="current-products-grid">
                        {products.map(p => (
                            <div key={p.id} className="admin-product-item">
                                <img src={p.images[0]} alt={p.title} />
                                <div className="admin-product-info"><h4>{p.title}</h4><p>${p.price}</p></div>
                                <button onClick={() => handleDelete(p.id)} className="delete-btn">Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
