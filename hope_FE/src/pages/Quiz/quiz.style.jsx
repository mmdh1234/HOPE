import styled from 'styled-components';

export const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
  text-align: center;
`;

export const Card = styled.div`
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  padding: 2rem;
  border-radius: 8px;

  h1, h2 {
    margin-top: 0;
  }

  button {
    margin-top: 1rem;
    padding: 0.8rem 2rem;
    font-size: 1rem;
    cursor: pointer;
  }
`;

export const OptionsContainer = styled.div`
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const OptionButton = styled.button`
  padding: 1rem;
  border: 1px solid ${props => props.selected ? '#0d6efd' : '#ccc'};
  background-color: ${props => props.selected ? '#d1e7fd' : '#fff'};
  cursor: pointer;
  text-align: left;
  border-radius: 8px;
  font-size: 1rem;
`;

export const NavigationButtons = styled.div`
  margin-top: 2rem;
`;