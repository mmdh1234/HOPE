import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 60px;
`;

export const Title = styled.h1`
    font-size: 28px;
    margin-bottom: 24px;
`;

export const FormBox = styled.div`
    width: 360px;
    background: white;
    padding: 32px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
`;

export const TabBox = styled.div`
    display: flex;
    margin-bottom: 24px;
`;

export const TabButton = styled.button`
    flex: 1;
    padding: 12px 0;
    background-color: ${({ active }) => (active ? '#eee' : '#f9f9f9')};
    border: none;
    font-weight: ${({ active }) => (active ? 'bold' : 'normal')};
    border-radius: 8px;
    cursor: pointer;

    &:first-child {
        margin-right: 8px;
    }
`;

export const Label = styled.label`
    display: block;
    margin-top: 16px;
    margin-bottom: 6px;
    font-size: 14px;
`;

export const Input = styled.input`
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
`;

export const SubmitButton = styled.button`
  width: 100%;
  margin-top: 24px;
  padding: 12px;
  background-color: #0059ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
`;