import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Nav,
    NavItem,
    RightBox,
    LogoutButton
} from './header.style';

const Header = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('isLoggedIn');
        navigate('/');
    };

    return (
        <Nav>
            <div>
                <NavItem to="/main" $active={pathname === '/main'}>홈</NavItem>
                <NavItem to="/main/learn" $active={pathname === '/main/learn'}>학습하기</NavItem>
                <NavItem to="/main/quiz" $active={pathname === '/main/quiz'}>퀴즈</NavItem>
                <NavItem to="/main/progress" $active={pathname === '/main/progress'}>진도확인</NavItem>
            </div>
            <RightBox>
                <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
            </RightBox>
        </Nav>
    );
};

export default Header;