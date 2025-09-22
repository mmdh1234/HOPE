import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 95%;
    margin: 0 auto;
    gap: 24px;
`;

export const Header = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    background: linear-gradient(90deg, #6e48ff, #946eff);
    border-radius: 12px;
    color: white;
`;

export const GreetingBox = styled.div`
    h2 {
        font-size: 24px;
        font-weight: bold;
        margin: 0 0 8px 0;
    }
    p {
        margin: 0;
        font-size: 16px;
        opacity: 0.9;
    }
`;

export const StreakBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.2);
    padding: 12px 20px;
    border-radius: 10px;

    span {
        font-size: 28px;
        font-weight: bold;
    }
    p {
        margin: 0;
        font-size: 14px;
    }
`;

export const CardContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
`;

export const Card = styled.div`
    background-color: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    border: 1px solid #f0f0f0;
`;

export const CardIcon = styled.div`
    font-size: 24px;
    margin-bottom: 12px;
`;

export const CardTitle = styled.h3`
    font-size: 20px;
    font-weight: bold;
    margin: 0 0 8px 0;
`;

export const CardDescription = styled.p`
    font-size: 14px;
    color: #666;
    margin: 0 0 24px 0;
    flex-grow: 1;
`;

const buttonColors = {
    learn: { bg: '#333', text: 'white' },
    quiz: { bg: '#28a745', text: 'white' },
    progress: { bg: '#8a2be2', text: 'white' },
};

export const CardButton = styled.button`
    width: 100%;
    padding: 12px 0;
    font-size: 16px;
    font-weight: bold;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background-color: ${({ color }) => buttonColors[color]?.bg || '#333'};
    color: ${({ color }) => buttonColors[color]?.text || 'white'};
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.8;
    }
`;

export const ProgressSection = styled.div`
    background-color: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    border: 1px solid #f0f0f0;
`;

export const SectionTitle = styled.h3`
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 24px 0;
`;

export const WeekGrid = styled.div`
    display: flex;
    justify-content: space-around;
    text-align: center;
    margin-bottom: 16px;
`;

export const Day = styled.div`
    p {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #888;
    }
    span {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: ${({ done }) => (done ? '#28a745' : '#f0f0f0')};
        color: ${({ done }) => (done ? 'white' : 'transparent')};
        font-size: 20px;
    }
`;

export const ProgressBarContainer = styled.div`
    width: 100%;
    height: 10px;
    background-color: #f0f0f0;
    border-radius: 5px;
    overflow: hidden;
`;

export const ProgressBarFill = styled.div`
    width: ${({ progress }) => progress}%;
    height: 100%;
    background-color: #28a745;
    border-radius: 5px;
    transition: width 0.5s ease-in-out;
`;

export const ProgressText = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #555;
    margin-bottom: 8px;
`;