import { useEffect } from 'react'; // 👈 1. useEffect 훅 가져오기
import { Outlet, useNavigate } from 'react-router-dom'; // 👈 2. useNavigate 훅 가져오기
import Header from '../components/common/MainHeader/Header';

const MainLayout = () => {
    const navigate = useNavigate(); // 👈 3. navigate 함수 준비

    // 👇 4. '문지기' 로직 추가
    useEffect(() => {
        // sessionStorage에서 로그인 상태를 확인
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        
        // 만약 로그인되어 있지 않다면
        if (!isLoggedIn) {
            alert('로그인이 필요합니다.'); // 사용자에게 알려주고
            navigate('/'); // 로그인 페이지로 보냅니다.
        }
    }, [navigate]); // navigate 함수가 바뀔 때만 이 효과를 다시 실행합니다.

    return (
        <div>
            <Header />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;