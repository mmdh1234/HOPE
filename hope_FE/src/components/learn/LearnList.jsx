import React from 'react';
import { Link } from 'react-router-dom';
import LearnCard from './LearnCard';
import styled from 'styled-components';

const CardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;

  a {
    text-decoration: none;
    color: inherit;
  }
`;

const LearnList = ({ materials }) => {
    return (
        <CardContainer>
            {materials.map(material => (
                // Link 경로가 수정되었습니다.
                <Link key={material.id} to={`/main/learn/${material.id}`}>
                    <LearnCard material={material} />
                </Link>
            ))}
        </CardContainer>
    );
};

export default LearnList;