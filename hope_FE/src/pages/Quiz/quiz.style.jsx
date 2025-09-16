import styled from 'styled-components';

// 1. 전체 페이지 레이아웃 (LearnPage와 유사하게)
export const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #f7f8fc;
  padding: 32px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;

  h1 {
    margin-bottom: 2rem;
  }
`;

// 2. 카드 디자인 개선 (HomePage와 유사하게)
export const Card = styled.div`
  width: 100%;
  max-width: 800px;
  background-color: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  text-align: left;

  h1, h2 {
    margin-top: 0;
    text-align: center;
  }
`;

export const QuestionText = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 2.5rem;
  text-align: center;
`;

export const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// 3. 버튼 스타일 통일
export const OptionButton = styled.button`
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
  border-radius: 12px;
  border: 2px solid ${({ selected }) => (selected ? '#0059ff' : '#dee2e6')};
  background-color: ${({ selected }) => (selected ? '#e7f0ff' : 'white')};
  color: ${({ selected }) => (selected ? '#0059ff' : '#333')};
  font-weight: ${({ selected }) => (selected ? 'bold' : 'normal')};
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: #0059ff;
  }
`;

export const NavigationButtons = styled.div`
  margin-top: 3rem;
  text-align: right;
`;

// 공용 버튼 스타일을 가져와서 사용
export const ActionButton = styled.button`
  padding: 12px 28px;
  background-color: #0059ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.8;
  }
`;

// 4. 결과 페이지 스타일 추가
export const ResultCard = styled(Card)`
  text-align: center;
  
  h1 {
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 2.5rem;
    color: #0059ff;
    margin-bottom: 2rem;
  }
`;