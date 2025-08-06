import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 60px;
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 24px;
`;

const FormBox = styled.div`
  width: 360px;
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
`;

export const AuthFormLayout = ({ title, children }) => (
    <Wrapper>
        <Title>{title}</Title>
        <FormBox>{children}</FormBox>
    </Wrapper>
);