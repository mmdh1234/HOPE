import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';

const TabBox = styled.div`
  display: flex;
  margin-bottom: 24px;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 12px 0;
  background-color: ${({ active }) => (active ? '#eee' : '#f9f9f9')};
  border: none;
  font-weight: ${({ active }) => (active ? 'bold' : 'normal')};
  border-radius: 8px;
  cursor: pointer;

  &:first-child {
    margin-right: 8px;
  }
`;

export const AuthTabHeader = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <TabBox>
            <TabButton active={pathname === '/'} onClick={() => navigate('/')}>로그인</TabButton>
            <TabButton active={pathname === '/signup'} onClick={() => navigate('/signup')}>회원가입</TabButton>
        </TabBox>
    );
};