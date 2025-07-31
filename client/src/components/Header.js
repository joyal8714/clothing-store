import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const Header = () => {
    return (
        <header className="main-header">
            <Link to="/" className="logo">DESIGNCo</Link>
            <nav className="main-nav">
                <NavLink to="/category/men">Men</NavLink>
                <NavLink to="/category/women">Women</NavLink>
                <NavLink to="/category/kids">Kids</NavLink>
                <NavLink to="/admin" className="nav-admin">Admin</NavLink>
            </nav>
        </header>
    );
};

export default Header;
