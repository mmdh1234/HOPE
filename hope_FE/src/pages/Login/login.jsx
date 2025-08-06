import React, { useState } from 'react';
import {
    Wrapper,
    FormBox,
    TabBox,
    TabButton,
    Input,
    LoginButton,
    Title,
    Label
} from './login.style.jsx';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const isLogin = location.pathname === '/';

    const handleLogin = () => {
        if (email && password) {
            localStorage.setItem('isLoggedIn', 'true');
            navigate('/main');
        } else {
            alert('이메일과 비밀번호를 입력하세요.');
        }
    };

    return (
        <Wrapper>
            <Title>코딩나라</Title>
            <p>SW와 코딩을 배우고 성장하는 공간</p>

            <FormBox>
                <TabBox>
                    <TabButton active={isLogin} onClick={() => navigate('/')}>
                        로그인
                    </TabButton>
                    <TabButton active={!isLogin} onClick={() => navigate('/signup')}>
                        회원가입
                    </TabButton>
                </TabBox>

                <Label>이메일</Label>
                <Input
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Label>비밀번호</Label>
                <Input
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <LoginButton onClick={handleLogin}>로그인</LoginButton>
            </FormBox>
        </Wrapper>
    );
};

export default LoginPage;