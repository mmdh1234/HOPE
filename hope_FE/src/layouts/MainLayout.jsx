import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';

const MainLayout = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <h2>🌟 Main Layout</h2>
            <Outlet />
        </>
    );
};

export default MainLayout;