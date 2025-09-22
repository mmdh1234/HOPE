import styled, { css } from 'styled-components';

// 페이지 전체를 감싸는 컨테이너
export const LearnPageContainer = styled.div`
  width: 90%;
  margin: 0 auto;
  
  /* background-color: #f7f8ff; // 전체적인 배경색 */
`;

// '학습하기', '자료 업로드' 탭을 감싸는 컨테이너
export const TabsContainer = styled.div`
  display: flex;
  padding: 6px;
  background-color: #e9ecef; // 탭 컨테이너 배경색
  border-radius: 999px; // 둥근 타원형 모양
  margin-bottom: 2rem;
`;

// 개별 탭 버튼
export const Tab = styled.button`
  flex: 1; // 탭이 컨테이너 안에서 동일한 너비를 갖도록 함
  padding: 12px 20px;
  border: none;
  border-radius: 999px; // 둥근 알약 모양
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  outline: none;
  
  // 'active' prop 값에 따라 다른 스타일을 적용
  ${(props) =>
    props.active
        ? css`
          background-color: #ffffff; // 활성화된 탭 배경색
          color: #333; // 활성화된 탭 글자색
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        `
        : css`
          background-color: transparent; // 비활성화된 탭 배경색
          color: #868e96; // 비활성화된 탭 글자색
        `}
`;

// 탭 아래의 컨텐츠 영역 (카드 목록 또는 업로드 폼)
export const ContentArea = styled.div`
  margin-top: 1.5rem;
`;