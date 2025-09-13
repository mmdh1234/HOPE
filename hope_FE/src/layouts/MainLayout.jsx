import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/MainHeader/Header.jsx';

const MainLayout = () => {
    return (
        <>
            <Header />
            <main>
                <Outlet />
            </main>
        </>
    );
};

export default MainLayout;