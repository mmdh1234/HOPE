import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
`;

export const NavItem = styled(Link)`
  margin-right: 32px;
  font-size: 16px;
  font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
  color: ${({ $active }) => ($active ? '#0059ff' : '#333')};
  text-decoration: none;

  &:hover {
    color: #0059ff;
  }
`;

export const RightBox = styled.div`
  display: flex;
  align-items: center;
`;

export const LogoutButton = styled.button`
  padding: 8px 16px;
  background-color: #ff5555;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background-color: #ff2222;
  }
`;