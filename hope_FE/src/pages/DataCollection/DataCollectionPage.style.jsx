import styled, { css, keyframes } from 'styled-components';

const pulse = keyframes`
  0% { transform: scale(0.95); opacity: 1; }
  100% { transform: scale(1.05); opacity: 0; }
`;

export const PageWrapper = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background-color: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

export const MainContainer = styled.div`
  width: 100%;
  max-width: 80rem; /* 1280px */
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* 24px */
`;

export const VideoContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const CameraControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem; /* 8px */
  margin-bottom: 0.75rem; /* 12px */
`;

export const CameraLabel = styled.label`
  font-size: 0.875rem; /* 14px */
  line-height: 1.25rem; /* 20px */
  color: #4b5563;
  min-width: 5rem; /* 80px */
`;

export const CameraSelect = styled.select`
  flex-grow: 1;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem; /* 6px */
  border: 1px solid #d1d5db;
`;

export const RefreshButton = styled.button`
  margin-left: 0.5rem;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  &:hover {
    background-color: #f9fafb;
  }
`;

export const VideoWrapper = styled.div`
  background-color: #000;
  border-radius: 1rem;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 16 / 9;
  position: relative;
`;

export const StyledVideo = styled.video`
  display: none;
`;

export const StyledCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

export const StatusBadge = styled.div`
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  background-color: rgba(0, 0, 0, 0.4);
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
`;

export const InfoPanel = styled.div`
  background-color: #fff;
  border-radius: 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
`;

export const InfoText = styled.p`
  color: #4b5563;
  margin-top: 0.25rem;
`;

export const StartButton = styled.button`
  margin-top: 1.25rem;
  width: 100%;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: #fff;
  font-weight: 500;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  ${(props) =>
    props.disabled
      ? css`
          background-color: #9ca3af;
          opacity: 0.6;
          cursor: not-allowed;
        `
      : css`
          background-color: #4f46e5;
          &:hover {
            background-color: #4338ca;
          }
        `}
`;

export const LogSection = styled.div`
  margin-top: 1.5rem;
`;

export const LogTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

export const LogBox = styled.div`
  height: 11rem; /* 176px */
  overflow: auto;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #1f2937;
`;

export const LogMessage = styled.div`
  line-height: 1.5rem;
`;

export const EmptyLogMessage = styled.div`
  color: #9ca3af;
`;

export const BulletList = styled.ul`
  margin-top: 1.5rem;
  font-size: 0.75rem;
  color: #4b5563;
  list-style-type: disc;
  padding-left: 1.25rem;
`;

export const ListItem = styled.li`
  margin-top: 0.25rem;
`;