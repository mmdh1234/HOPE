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
      {materials.map((course) => (
        // 👇 Link 태그에 state prop을 추가합니다.
        <Link
          key={course._id}
          to={`/main/learn/${course._id}`}
          // 🔥 state를 통해 마지막 페이지 번호(currentPage)를 전달합니다.
          state={{ startPage: course.currentPage }}
        >
          <LearnCard material={course} />
        </Link>
      ))}
    </CardContainer>
  );
};

export default LearnList;