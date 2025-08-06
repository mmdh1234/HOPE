import React, { useState } from 'react';
import {
    Wrapper,
    FormBox,
    TabBox,
    TabButton,
    Input,
    SubmitButton,
    Title,
    Label
} from './signup.style.jsx';
import { useNavigate, useLocation } from 'react-router-dom';

const SignupPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isSignup = location.pathname === '/signup';

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        const { name, email, password, confirmPassword } = form;
        if (!name || !email || !password || !confirmPassword) {
            alert('모든 항목을 입력해주세요.');
            return;
        }
        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        localStorage.setItem('isLoggedIn', 'true');
        navigate('/main');
    };

    return (
        <Wrapper>
            <Title>코딩나라</Title>
            <p>SW와 코딩을 배우고 성장하는 공간</p>

            <FormBox>
                <TabBox>
                    <TabButton active={!isSignup} onClick={() => navigate('/')}>
                        로그인
                    </TabButton>
                    <TabButton active={isSignup} onClick={() => navigate('/signup')}>
                        회원가입
                    </TabButton>
                </TabBox>

                <Label>이름</Label>
                <Input
                    type="text"
                    name="name"
                    placeholder="이름을 입력하세요"
                    value={form.name}
                    onChange={handleChange}
                />

                <Label>이메일</Label>
                <Input
                    type="email"
                    name="email"
                    placeholder="이메일을 입력하세요"
                    value={form.email}
                    onChange={handleChange}
                />

                <Label>비밀번호</Label>
                <Input
                    type="password"
                    name="password"
                    placeholder="비밀번호를 입력하세요"
                    value={form.password}
                    onChange={handleChange}
                />

                <Label>비밀번호 확인</Label>
                <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={form.confirmPassword}
                    onChange={handleChange}
                />

                <SubmitButton onClick={handleSubmit}>회원가입</SubmitButton>
            </FormBox>
        </Wrapper>
    );
};

export default SignupPage;