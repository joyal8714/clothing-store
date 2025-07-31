import React from 'react';

// A simple function to find a valid image URL
const getImageUrl = (images) => {
    if (!images || images.length === 0) return 'https://via.placeholder.com/300x400.png?text=No+Image';
    // The server now provides full URLs for uploaded images
    return images[0];
};

const ProductCard = ({ product, onCardClick }) => {
    return (
        <div className="product-card" onClick={() => onCardClick(product)}>
            <img src={getImageUrl(product.images)} alt={product.title} className="product-image" />
            <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-description">{product.description.substring(0, 80)}...</p>
                <div className="product-footer">
                    <span className="product-price">${product.price}</span>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
