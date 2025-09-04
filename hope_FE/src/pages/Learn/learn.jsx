import React, { useState } from 'react';
// 경로가 수정되었습니다.
import LearnList from '../../components/learn/LearnList.jsx';
import LearnUpload from '../../components/learn/LearnUpload.jsx';
import { LearnPageContainer, TabsContainer, Tab, ContentArea } from './learn.style';

const LearnPage = () => {
    const [activeTab, setActiveTab] = useState('list');
    const [materials, setMaterials] = useState([
        // 테스트를 위한 초기 더미 데이터
        {
            id: 1,
            title: '컴퓨터 기초',
            description: '컴퓨터의 구성요소와 기본 원리를 배워봅시다.',
            category: '컴퓨터 기초',
            progress: 100,
            totalPages: 12,
            difficulty: '쉬움',
            fileType: 'PDF',
            size: '2.5MB'
        },
        {
            id: 2,
            title: '인터넷 기초 알아보기',
            description: '인터넷의 개념과 웹 브라우저 사용법을 익혀봅시다.',
            category: '인터넷',
            progress: 60,
            totalPages: 18,
            difficulty: '쉬움',
            fileType: 'PDF',
            size: '3.2MB'
        }
    ]);

    const addMaterial = (newMaterial) => {
        setMaterials(prevMaterials => [
            ...prevMaterials,
            { ...newMaterial, id: Date.now() }
        ]);
        setActiveTab('list');
    };

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
                {activeTab === 'list' && <LearnList materials={materials} />}
                {activeTab === 'upload' && <LearnUpload onAddMaterial={addMaterial} />}
            </ContentArea>
        </LearnPageContainer>
    );
};

export default LearnPage;