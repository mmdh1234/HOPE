import styled from 'styled-components';

export const CardWrapper = styled.div`
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

export const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0;
  // 제목이 길 경우 잘리도록 추가
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const DeleteButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #868e96;
  padding: 4px;
  flex-shrink: 0; // 버튼 크기가 줄어들지 않도록

  &:hover {
    color: #ff6b6b;
  }
`;

export const Description = styled.p`
  font-size: 0.9rem;
  color: #666;
  flex-grow: 1;
`;

export const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  margin-top: 1rem;
`;

export const ProgressBar = styled.div`
  width: ${(props) => props.progress}%;
  height: 100%;
  background-color: #4b8bff;
  border-radius: 4px;
  transition: width 0.3s ease-in-out;
`;

export const InfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #868e96;
  margin-top: 1rem;
`;

export const ContinueButton = styled.button`
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