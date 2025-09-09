import React, { useState, useEffect } from 'react';
import LearnList from '../../components/learn/LearnList.jsx';
import LearnUpload from '../../components/learn/LearnUpload.jsx';
import { LearnPageContainer, TabsContainer, Tab, ContentArea } from './learn.style';

const LearnPage = () => {
    const [activeTab, setActiveTab] = useState('list');
    const [courses, setCourses] = useState([]); // 더미 데이터 제거, 빈 배열로 초기화

    // API로부터 강좌 목록을 가져오는 함수
    const fetchCourses = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/courses', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) {
                throw new Error('강좌 목록을 불러오는데 실패했습니다.');
            }
            const data = await res.json();
            // 최신순으로 정렬 (createdAt 기준)
            const sortedCourses = data.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setCourses(sortedCourses || []);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        }
    };

    // 컴포넌트가 처음 마운트될 때 강좌 목록을 불러옵니다.
    useEffect(() => {
        fetchCourses();
    }, []);

    return (
        <LearnPageContainer>
            <TabsContainer>
                <Tab active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
                    학습하기
                </Tab>
                <Tab active={activeTab === 'upload'} onClick={() => setActiveTab('upload')}>
                    자료 업로드
                </Tab>
            </TabsContainer>

            <ContentArea>
                {/* LearnList에 courses 상태를 전달 */}
                {activeTab === 'list' && <LearnList materials={courses} />}
                
                {/* LearnUpload에 업로드 성공 시 목록을 새로고침하는 함수를 전달 */}
                {activeTab === 'upload' && <LearnUpload onUploadSuccess={() => {
                    fetchCourses(); // 목록 새로고침
                    setActiveTab('list'); // '학습하기' 탭으로 이동
                }} />}
            </ContentArea>
        </LearnPageContainer>
    );
};

export default LearnPage;