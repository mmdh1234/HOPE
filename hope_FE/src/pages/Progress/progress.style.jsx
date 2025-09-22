import styled from 'styled-components';

export const ProgressContainer = styled.div`
    padding: 40px;
    max-width: 1000px;
    margin: 0 auto;
    font-family: 'Pretendard', sans-serif;
`;

export const Title = styled.h1`
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 30px;
    color: #212529;
`;

export const SummaryBox = styled.div`
    background-color: #f8f9fa;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 40px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

export const SummaryTitle = styled.h2`
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
    color: #495057;
`;

export const SummaryProgress = styled.p`
    font-size: 24px;
    font-weight: 700;
    color: #007bff;
    text-align: right;
`;

export const CourseList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

export const CourseCard = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: #ffffff;
    border: 1px solid #dee2e6;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }

    & > div {
        flex-grow: 1;
        margin-right: 20px;
        display: flex;
        align-items: center;
        gap: 20px;
    }
    
    span {
        font-weight: 600;
        color: #343a40;
        min-width: 50px;
        text-align: right;
    }
`;

export const CourseTitle = styled.h3`
    font-size: 18px;
    font-weight: 600;
    color: #343a40;
    margin: 0;
    flex-basis: 40%; // 너비 고정
`;

export const ProgressBarContainer = styled.div`
    width: 100%;
    height: 12px;
    background-color: #e9ecef;
    border-radius: 6px;
    overflow: hidden;
    flex-grow: 1;
`;

export const ProgressBar = styled.div`
    width: ${(props) => props.$progress || 0}%;
    height: 100%;
    background-color: #28a745;
    border-radius: 6px;
    transition: width 0.5s ease-in-out;
`;

export const ContinueButton = styled.button`
    padding: 10px 18px;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    background-color: #007bff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
    white-space: nowrap; // 버튼 글자 줄바꿈 방지

    &:hover {
        background-color: #0056b3;
    }
`;

export const LoadingText = styled.p`
    text-align: center;
    font-size: 18px;
    color: #868e96;
    padding: 50px;
`;

export const NoCoursesText = styled.p`
    text-align: center;
    font-size: 16px;
    color: #495057;
    padding: 50px;
    background-color: #f8f9fa;
    border-radius: 10px;
`;