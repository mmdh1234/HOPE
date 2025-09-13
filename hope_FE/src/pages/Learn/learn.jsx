import React, { useState, useEffect } from 'react';
import LearnList from '../../components/learn/LearnList.jsx';
import LearnUpload from '../../components/learn/LearnUpload.jsx';
import { LearnPageContainer, TabsContainer, Tab, ContentArea } from './learn.style';

const LearnPage = () => {
    const [activeTab, setActiveTab] = useState('list');
    const [myCourses, setMyCourses] = useState([]); // courses를 myCourses로 변경하여 의미 명확화

    // --- 여기가 핵심 수정 부분입니다 ---
    // '나의 수강 목록'을 가져오는 함수
    const fetchMyCourses = async () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId'); // localStorage에서 userId 가져오기

        if (!userId) {
            console.error("사용자 ID를 찾을 수 없습니다. 로그인이 필요합니다.");
            return;
        }

        try {
            // API 주소를 수강 목록을 가져오는 엔드포인트로 변경
            const res = await fetch(`/api/courses/users/${userId}/courses`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error('수강 목록을 불러오는데 실패했습니다.');
            }

            const data = await res.json();
            
            // 백엔드에서 받아온 데이터는 이미 course 객체를 포함하고 있습니다.
            // 최신 수강신청 순으로 정렬 (enrolledAt 기준)
            const sortedCourses = data.items.sort((a, b) => new Date(b.enrolledAt) - new Date(a.createdAt));
            setMyCourses(sortedCourses || []);

        } catch (error) {
            console.error("Failed to fetch enrolled courses:", error);
        }
    };

    // 컴포넌트가 처음 마운트될 때 나의 수강 목록을 불러옵니다.
    useEffect(() => {
        fetchMyCourses();
    }, []);

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
                {/* LearnList에 myCourses 상태를 전달 */}
                {activeTab === 'list' && <LearnList materials={myCourses} />}
                
                {/* 자료 업로드 후에는 전체 강좌 목록이 아닌 '내 학습' 목록을 새로고침해야 합니다.
                  (현재 구조에서는 업로드 후 바로 수강신청이 되지 않으므로, 목록에 변화는 없을 수 있습니다.)
                */}
                {activeTab === 'upload' && <LearnUpload onUploadSuccess={() => {
                    fetchMyCourses(); // 나의 수강 목록 새로고침
                    setActiveTab('list');
                }} />}
            </ContentArea>
        </LearnPageContainer>
    );
};

export default LearnPage;