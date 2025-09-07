import { Routes, Route } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout.jsx';
import MainLayout from '../layouts/MainLayout.jsx';

import LoginPage from '../pages/Login/login.jsx';
import SignupPage from '../pages/Signup/signup.jsx';
import HomePage from '../pages/Home/home.jsx';
import LearnPage from '../pages/Learn/learn.jsx';
import QuizListPage from '../pages/QuizList/QuizListPage';
import QuizPage from '../pages/Quiz/quiz';
import ProgressPage from '../pages/Progress/progress.jsx';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Auth Layout */}
            <Route path="/" element={<AuthLayout />}>
                <Route index element={<LoginPage />} />
                <Route path="signup" element={<SignupPage />} />
            </Route>

             {/* Main Layout */}
            <Route path="/main" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="learn" element={<LearnPage />} />
                <Route path="quiz">
                    <Route index element={<QuizListPage />} />
                    <Route path=":quizId" element={<QuizPage />} />
                </Route>
                <Route path="progress" element={<ProgressPage />} />
            </Route>

            <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
    );
};

export default AppRoutes;