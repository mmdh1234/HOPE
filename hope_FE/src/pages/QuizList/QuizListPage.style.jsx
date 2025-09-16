import styled from 'styled-components';

// LearnPage와 유사한 전체 페이지 컨테이너
export const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #f7f8fc;
  padding: 32px;
  box-sizing: border-box;
`;

// HomePage의 Card 스타일을 재활용
export const SectionCard = styled.div`
  background-color: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  margin-bottom: 2rem;

  h1, h2 {
    margin-top: 0;
  }
`;


export const ErrorMessage = styled.p`
  color: #f5222d;
  margin-top: 1rem;
`;

// HomePage의 Card 스타일을 리스트 아이템에 맞게 변형
export const QuizListItem = styled.div`
  background-color: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  margin-bottom: 1rem;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }

  h3 { margin: 0 0 8px 0; }
  p { margin: 0; color: #666; }
`;

export const UploadArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  margin-bottom: 1.5rem;
  border: 2px dashed #ced4da;
  border-radius: 12px;
  background-color: #f8f9fa;
  text-align: center;
  transition: border-color 0.2s;

  &:hover {
    border-color: #0059ff;
  }
`;

export const UploadIcon = styled.div`
  font-size: 48px;
  color: #868e96;
  margin-bottom: 1rem;
`;

export const UploadText = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 0.5rem 0;
`;

export const SupportedFilesText = styled.p`
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0 0 1.5rem 0;
`;

// 숨겨진 실제 input 태그
export const FileInput = styled.input`
  display: none;
`;

// '파일 선택' 버튼 스타일
export const FileSelectButton = styled.button`
  padding: 10px 20px;
  background-color: #343a40;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;

  &:hover {
    background-color: #495057;
  }
`;

// 선택된 파일 이름 표시
export const SelectedFileText = styled.p`
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #28a745;
    font-weight: 600;
`;