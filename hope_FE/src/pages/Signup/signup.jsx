import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthFormLayout } from '../../components/auth/AuthFormLayout';
import { AuthTabHeader } from '../../components/auth/AuthTabHeader';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Label from '../../components/ui/Label';

const SignupPage = () => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSignup = () => {
        const { name, email, password, confirmPassword } = form;
        if (!name || !email || !password || !confirmPassword) return alert('모든 항목을 입력해주세요.');
        if (password !== confirmPassword) return alert('비밀번호가 일치하지 않습니다.');
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/main');
    };

    return (
        <AuthFormLayout title="코딩나라">
            <p>SW와 코딩을 배우고 성장하는 공간</p>
            <AuthTabHeader />
            <Label>이름</Label>
            <Input type="text" name="name" value={form.name} onChange={handleChange} placeholder="이름 입력" />
            <Label>이메일</Label>
            <Input type="email" name="email" value={form.email} onChange={handleChange} placeholder="이메일 입력" />
            <Label>비밀번호</Label>
            <Input type="password" name="password" value={form.password} onChange={handleChange} placeholder="비밀번호 입력" />
            <Label>비밀번호 확인</Label>
            <Input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="비밀번호 확인" />
            <Button onClick={handleSignup}>회원가입</Button>
        </AuthFormLayout>
    );
};

export default SignupPage;
