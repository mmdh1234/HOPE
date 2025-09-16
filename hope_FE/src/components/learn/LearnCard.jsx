import React from 'react';
import styled from 'styled-components';


const CardWrapper = styled.div`
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0 0 8px 0;
`;

const Description = styled.p`
  font-size: 0.9rem;
  color: #666;
  flex-grow: 1;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  margin-top: 1rem;
`;

const ProgressBar = styled.div`
  width: ${props => props.progress}%;
  height: 100%;
  background-color: #4B8BFF;
  border-radius: 4px;
`;

const InfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #868e96;
  margin-top: 1rem;
`;

const ContinueButton = styled.button`
  width: 100%;
  padding: 12px;
  margin-top: 1.5rem;
  border: none;
  background-color: #1e293b;
  color: white;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
`;

// material prop을 course로 변경하여 의미를 명확하게 합니다.
const LearnCard = ({ material: course }) => {
    // 난이도를 한글로 매핑
    const difficultyMap = {
        beginner: '초급',
        intermediate: '중급',
        advanced: '고급',
    };

    return (
        <CardWrapper>
            <Title>{course.title}</Title>
            <Description>{course.description}</Description>

            <div>진도율</div>
            <ProgressBarContainer>
                {/* 진도율은 아직 없으므로 0%로 고정 */}
                <ProgressBar progress={0} />
            </ProgressBarContainer>

            <InfoContainer>
                <span>{difficultyMap[course.difficulty] || '미설정'}</span>
                <span>PDF</span> {/* 파일 타입은 PDF로 고정 */}
                <span>{`${course.totalPages || 1}페이지`}</span>
                <span>{course.studentCount}명 수강</span>
            </InfoContainer>

            <ContinueButton>계속 읽기</ContinueButton>
        </CardWrapper>
    );
};

export default LearnCard;