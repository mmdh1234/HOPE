import styled from 'styled-components';

export const PageWrapper = styled.div`
  background-color: #f8f9fa;
  padding: 2rem;
`;

export const Header = styled.header`
  background-color: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 2rem;
`;

export const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

export const BackButton = styled.button`
  background: none;
  border: 1px solid #dee2e6;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  &:hover {
    background-color: #f1f3f5;
  }
`;

export const Title = styled.h1`
  font-size: 1.75rem;
  margin: 0;
`;

export const Description = styled.p`
  font-size: 1rem;
  color: #495057;
  margin: 0.5rem 0 0 0;
`;

export const MetaInfo = styled.div`
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #868e96;
  margin-top: 1rem;
`;

export const PdfViewerContainer = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

export const PageNumber = styled.span`
  font-weight: 500;
`;

export const NavButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  background-color: #e9ecef;
  border: none;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PdfDocumentWrapper = styled.div`
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 2rem;
`;

export const LoadingText = styled.p`
    padding: 4rem;
    color: #868e96;
`;

export const Footer = styled.footer`
  position: sticky;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: white;
  padding: 1rem 2rem;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
`;

export const ProgressBarContainer = styled.div`
  width: 100%;
  height: 10px;
  background-color: #e9ecef;
  border-radius: 5px;
  margin-bottom: 0.5rem;
`;

export const ProgressBarFill = styled.div`
  width: ${({ progress }) => progress}%;
  height: 100%;
  background-color: #0059ff;
  border-radius: 5px;
  transition: width 0.3s ease;
`;

export const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 500;
`;