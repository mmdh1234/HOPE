import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';

const MainLayout = () => {
    return (
        <>
            <Header />
            <main style={{ padding: '32px' }}>
                <Outlet />
            </main>
        </>
    );
};

export default MainLayout;