import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query'; // 👈 useQuery 임포트
import LearnList from '../../components/learn/LearnList.jsx';
import LearnUpload from '../../components/learn/LearnUpload.jsx';
import { getMyCourses } from '../../api/api'; // 👈 새로 만든 API 함수 임포트
import { LearnPageContainer, TabsContainer, Tab, ContentArea } from './learn.style';

const LearnPage = () => {
  const [activeTab, setActiveTab] = useState('list');

  // 🔥 useState, useEffect를 모두 useQuery 하나로 대체!
  const {
    data: myCoursesData, // React Query가 가져온 데이터
    isLoading,
    isError,
    refetch, // 업로드 성공 시 수동으로 목록을 새로고침하기 위한 함수
  } = useQuery({
    queryKey: ['myCourses'], // 👈 이 열쇠가 핵심! LearnCard에서도 이 열쇠를 사용합니다.
    queryFn: getMyCourses, // 데이터를 가져올 함수
  });

  // 로딩 중일 때
  if (isLoading) return <div>로딩 중...</div>;

  // 에러 발생 시
  if (isError) return <div>오류가 발생했습니다.</div>;

  // API 응답에서 실제 배열을 추출 (myCoursesData.data.items 형식일 수 있음)
  const myCourses = myCoursesData?.data?.items || [];
  
  // 최신 수강신청 순으로 정렬
  const sortedCourses = [...myCourses].sort((a, b) => new Date(b.enrolledAt) - new Date(a.createdAt));

  return (
    <LearnPageContainer>
      <TabsContainer>
        <Tab active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
          내 학습
        </Tab>
        <Tab active={activeTab === 'upload'} onClick={() => setActiveTab('upload')}>
          자료 업로드
        </Tab>
      </TabsContainer>

      <ContentArea>
        {activeTab === 'list' && <LearnList materials={sortedCourses} />}
        {activeTab === 'upload' && (
          <LearnUpload
            onUploadSuccess={() => {
              refetch(); // 업로드 성공 시 'myCourses' 쿼리를 다시 실행
              setActiveTab('list');
            }}
          />
        )}
      </ContentArea>
    </LearnPageContainer>
  );
};

export default LearnPage;