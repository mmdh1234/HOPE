import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';

const AuthLayout = () => {
    // localStorage에서 로그인 상태를 가져옵니다.
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    // 만약 이미 로그인된 상태라면, 바로 '/main' 경로로 이동시킵니다.
    if (isLoggedIn) {
        return <Navigate to="/main" replace />;
    }

    // 로그인 상태가 아니라면, AuthLayout의 자식 라우트를 렌더링합니다.
    return (
        <div>
            <Outlet />
        </div>
    );
};

export default AuthLayout;