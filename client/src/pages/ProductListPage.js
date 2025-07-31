import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';

const API_URL = 'http://localhost:3000/api/products';

const ProductListPage = () => {
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { categoryName } = useParams();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setAllProducts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (categoryName) {
            const filtered = allProducts.filter(p => p.category.toLowerCase() === categoryName.toLowerCase());
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(allProducts);
        }
    }, [categoryName, allProducts]);

    const handleCardClick = (product) => {
        setSelectedProduct(product);
    };

    const handleCloseModal = () => {
        setSelectedProduct(null);
    };

    const getPageTitle = () => {
        if (!categoryName) return "All Our Masterpieces";
        return categoryName.charAt(0).toUpperCase() + categoryName.slice(1) + "'s Collection";
    }

    if (isLoading) return <div className="container"><p>Loading products...</p></div>;
    if (error) return <div className="container"><p>Error: {error}</p></div>;

    return (
        <>
            <div className="container">
                <h2 className="page-title">{getPageTitle()}</h2>
                <div className="product-grid">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} onCardClick={handleCardClick} />
                    ))}
                </div>
            </div>
            {selectedProduct && <ProductModal product={selectedProduct} onClose={handleCloseModal} />}
        </>
    );
};

export default ProductListPage;
