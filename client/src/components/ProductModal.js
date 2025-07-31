import React, { useState, useEffect } from 'react';

const ProductModal = ({ product, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Handle keyboard events for slider and closing
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') showNext();
            if (e.key === 'ArrowLeft') showPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [product.images]);

    if (!product) return null;
    
    const showNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % product.images.length);
    };

    const showPrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + product.images.length) % product.images.length);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="modal-close-btn">×</button>
                <div className="modal-body">
                    <div className="modal-slider-container">
                        <div className="modal-image-slider" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                            {product.images.map((src, index) => (
                                <img key={index} src={src} alt={`${product.title} - view ${index + 1}`} />
                            ))}
                        </div>
                        {product.images.length > 1 && (
                            <>
                                <button onClick={showPrev} className="slider-nav-btn prev">‹</button>
                                <button onClick={showNext} className="slider-nav-btn next">›</button>
                            </>
                        )}
                    </div>
                    <div className="modal-details">
                        <h2 id="modal-title">{product.title}</h2>
                        <p id="modal-description">{product.description}</p>
                        <div className="modal-footer">
                            <span id="modal-price" className="modal-price">${product.price}</span>
                            <a href="tel:8714116827" className="modal-call-btn">Call to Order</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
