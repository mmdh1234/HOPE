import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCourse } from '../../api/api';
import * as S from './LearnCard.style'; // 스타일 파일이 분리되어 있다고 가정

const LearnCard = ({ material: course }) => {
  const queryClient = useQueryClient();

  if (!course) {
    return null;
  }

  const progress = course.completionRate || 0;

  const deleteMutation = useMutation({
    mutationFn: () => deleteCourse(course._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCourses'] });
    },
    onError: (error) => {
      alert(`삭제 실패: ${error.response?.data?.message || error.message}`);
    },
  });

  // 🔥 삭제 버튼 클릭 시, 페이지 이동(Link)을 막는 것이 핵심!
  const handleDelete = (e) => {
    e.preventDefault(); // Link의 기본 동작을 막음
    e.stopPropagation(); // 이벤트가 상위로 전파되는 것을 막음
    if (window.confirm(`'${course.title}' 강좌를 정말 삭제하시겠습니까?`)) {
      deleteMutation.mutate();
    }
  };

  const difficultyMap = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
  };

  return (
    <S.CardWrapper>
      <S.TitleContainer>
        <S.Title>{course.title}</S.Title>
        {/* 👇 삭제 버튼에는 handleDelete 이벤트 핸들러를 연결 */}
        <S.DeleteButton onClick={handleDelete} disabled={deleteMutation.isLoading}>
          🗑️
        </S.DeleteButton>
      </S.TitleContainer>

      <S.Description>{course.description}</S.Description>

      <div>진도율 {Math.round(progress)}%</div>
      <S.ProgressBarContainer>
        <S.ProgressBar progress={progress} />
      </S.ProgressBarContainer>

      <S.InfoContainer>
        <span>{difficultyMap[course.difficulty] || '미설정'}</span>
        <span>PDF</span>
        <span>{`${course.totalPages || 1}페이지`}</span>
        {/* <span>{course.studentCount}명 수강</span> */}
      </S.InfoContainer>

      {/* 👇 이 버튼은 Link의 일부이므로 별도의 onClick 이벤트가 필요 없습니다. */}
      <S.ContinueButton>
        {progress > 0 ? '계속 읽기' : '자료 보기'}
      </S.ContinueButton>
    </S.CardWrapper>
  );
};

export default LearnCard;