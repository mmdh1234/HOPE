import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';

const Nav = styled.nav`
  display: flex;
  justify-content: center;
  gap: 48px;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
`;

const NavItem = styled(Link)`
  font-size: 16px;
  font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
  color: ${({ $active }) => ($active ? '#0059ff' : '#333')};
  text-decoration: none;

  &:hover {
    color: #0059ff;
  }
`;

const Header = () => {
    const { pathname } = useLocation();

    return (
        <Nav>
            <NavItem to="/main" $active={pathname === '/main'}>홈</NavItem>
            <NavItem to="/main/learn" $active={pathname === '/main/learn'}>학습하기</NavItem>
            <NavItem to="/main/quiz" $active={pathname === '/main/quiz'}>퀴즈</NavItem>
            <NavItem to="/main/progress" $active={pathname === '/main/progress'}>진도확인</NavItem>
        </Nav>
    );
};

export default Header;