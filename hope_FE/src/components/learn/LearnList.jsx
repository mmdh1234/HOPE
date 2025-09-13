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

// materials prop을 courses로 변경
const LearnList = ({ materials: courses }) => {
    return (
        <CardContainer>
            {/* courses 배열을 map으로 순회 */}
            {courses.map(course => (
                // key와 to 경로를 course._id로 변경
                <Link key={course._id} to={`/main/learn/${course._id}`}>
                    {/* material prop으로 course 객체 전달 */}
                    <LearnCard material={course} />
                </Link>
            ))}
        </CardContainer>
    );
};

export default LearnList;