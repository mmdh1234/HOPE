import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthFormLayout } from '../../components/auth/AuthFormLayout';
import { AuthTabHeader } from '../../components/auth/AuthTabHeader';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Label from '../../components/ui/Label';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = () => {
        if (!email || !password) return alert('이메일과 비밀번호를 입력하세요.');
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/main');
    };

    return (
        <AuthFormLayout title="코딩나라">
            <p>SW와 코딩을 배우고 성장하는 공간</p>
            <AuthTabHeader />
            <Label>이메일</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 입력" />
            <Label>비밀번호</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" />
            <Button onClick={handleLogin}>로그인</Button>
        </AuthFormLayout>
    );
};

export default LoginPage;
