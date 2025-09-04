import React from 'react';
import { useNavigate } from 'react-router-dom';
// 모든 스타일 컴포넌트를 'S'라는 이름의 객체로 가져옵니다.
import * as S from './home.style';

const HomePage = () => {
    const navigate = useNavigate();

    const userName = localStorage.getItem('userName') || '사용자';
    const streakDays = 5;
    const weeklyProgress = 5;
    const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

    return (
        // 각 컴포넌트 앞에 'S.'를 붙여 사용합니다.
        <S.Container>
            <S.Header>
                <S.GreetingBox>
                    <h2>안녕하세요, {userName}님!</h2>
                    <p>오늘도 함께 학습해볼까요?</p>
                </S.GreetingBox>
                <S.StreakBox>
                    <span>{streakDays}</span>
                    <p>일 연속 학습</p>
                </S.StreakBox>
            </S.Header>

            <S.CardContainer>
                <S.Card>
                    <S.CardIcon>📚</S.CardIcon>
                    <S.CardTitle>학습하기</S.CardTitle>
                    <S.CardDescription>SW와 코딩을 배워보세요</S.CardDescription>
                    <S.CardButton color="learn" onClick={() => navigate('/main/learn')}>▷ 시작하기</S.CardButton>
                </S.Card>
                <S.Card>
                    <S.CardIcon>💡</S.CardIcon>
                    <S.CardTitle>퀴즈 풀기</S.CardTitle>
                    <S.CardDescription>코딩 지식을 확인해보세요</S.CardDescription>
                    <S.CardButton color="quiz" onClick={() => navigate('/main/quiz')}>⊕ 도전하기</S.CardButton>
                </S.Card>
                <S.Card>
                    <S.CardIcon>📈</S.CardIcon>
                    <S.CardTitle>학습 현황</S.CardTitle>
                    <S.CardDescription>나의 학습 상황을 확인하세요</S.CardDescription>
                    <S.CardButton color="progress" onClick={() => navigate('/main/progress')}>➚ 확인하기</S.CardButton>
                </S.Card>
            </S.CardContainer>

            <S.ProgressSection>
                <S.SectionTitle>이번 주 학습 현황</S.SectionTitle>
                <S.WeekGrid>
                    {weekDays.map((day, index) => (
                        <S.Day key={day} done={index < weeklyProgress}>
                            <p>{day}</p>
                            <span>✔</span>
                        </S.Day>
                    ))}
                </S.WeekGrid>
                <S.ProgressText>
                    <span>주간 목표 달성도</span>
                    <span>{weeklyProgress}/{weekDays.length}일</span>
                </S.ProgressText>
                <S.ProgressBarContainer>
                    <S.ProgressBarFill progress={(weeklyProgress / weekDays.length) * 100} />
                </S.ProgressBarContainer>
            </S.ProgressSection>
        </S.Container>
    );
};

export default HomePage;