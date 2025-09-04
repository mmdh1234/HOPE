import React from 'react';
import styled from 'styled-components';

// 카드 전체 스타일
const CardWrapper = styled.div`
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  height: 100%; // 그리드 레이아웃에서 높이를 채우도록 설정

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
`;

// ... (나머지 스타일 컴포넌트는 아래에 이어서 작성)
const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0 0 8px 0;
`;

const Description = styled.p`
  font-size: 0.9rem;
  color: #666;
  flex-grow: 1; // 내용이 적어도 카드의 높이를 채우도록 함
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
  background-color: #4B8BFF; // 주요 색상
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

const LearnCard = ({ material }) => {
    return (
        <CardWrapper>
            <Title>{material.title}</Title>
            <Description>{material.description}</Description>

            <div>진도율</div>
            <ProgressBarContainer>
                <ProgressBar progress={material.progress} />
            </ProgressBarContainer>

            <InfoContainer>
                <span>{material.difficulty}</span>
                <span>{material.fileType}</span>
                <span>{`${material.totalPages}페이지`}</span>
                <span>{material.size}</span>
            </InfoContainer>

            <ContinueButton>계속 읽기</ContinueButton>
        </CardWrapper>
    );
};

export default LearnCard;