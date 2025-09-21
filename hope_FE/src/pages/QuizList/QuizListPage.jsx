import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// 🔥 React Query 훅들과 새로 만든 deleteQuiz API를 가져옵니다.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../api/api';
import * as S from './QuizListPage.style';

const QuizListPage = () => {
    const [file, setFile] = useState(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);

    // 🔥 1. useState와 useEffect 대신 useQuery로 퀴즈 목록을 가져옵니다.
    const { data: quizzesData, isLoading: isQuizzesLoading, isError } = useQuery({
        queryKey: ['quizzes'], // 이 퀴즈 목록의 "열쇠"는 'quizzes' 입니다.
        queryFn: api.getQuizzes,
    });
    const quizzes = quizzesData?.data?.data || []; // 실제 퀴즈 배열

    // 🔥 2. 퀴즈 생성을 위한 useMutation
    const createQuizMutation = useMutation({
        mutationFn: api.createQuiz,
        onSuccess: () => {
            alert('퀴즈가 성공적으로 생성되었습니다!');
            setFile(null);
            // 'quizzes' 열쇠를 무효화시켜 목록을 자동으로 새로고침합니다.
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        },
        onError: () => {
            alert('퀴즈 생성에 실패했습니다. 파일 형식을 확인해주세요.');
        },
    });

    // 🔥 3. 퀴즈 삭제를 위한 useMutation
    const deleteQuizMutation = useMutation({
        mutationFn: api.deleteQuiz,
        onSuccess: () => {
            alert('퀴즈가 삭제되었습니다.');
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        },
        onError: () => {
            alert('퀴즈 삭제에 실패했습니다.');
        },
    });

    const handleFileUpload = async () => {
        if (!file) return alert('파일을 선택해주세요.');
        const formData = new FormData();
        formData.append('file', file);
        createQuizMutation.mutate(formData);
    };

    // 🔥 4. 삭제 버튼 클릭 핸들러
    const handleDeleteQuiz = (e, quizId) => {
        e.stopPropagation(); // 퀴즈 풀기 페이지로 넘어가는 것을 방지
        e.preventDefault();
        if (window.confirm('정말로 이 퀴즈를 삭제하시겠습니까?')) {
            deleteQuizMutation.mutate(quizId);
        }
    };

    // --- 드래그 앤 드롭 및 파일 핸들링 함수 (기존과 동일) ---
    const onDrop = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        setFile(event.dataTransfer.files[0]);
    }, []);
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);
    const onFileSelectClick = () => fileInputRef.current.click();
    const handleFileChange = (e) => setFile(e.target.files[0]);

    return (
        <S.PageContainer>
            <h1>나의 퀴즈</h1>
            <S.SectionCard>
                {/* ... (퀴즈 생성 UI는 기존과 거의 동일) ... */}
                 <h2>새 퀴즈 만들기</h2>
        <S.UploadArea onDrop={onDrop} onDragOver={onDragOver}>
            <S.UploadIcon>📄</S.UploadIcon>
            <S.UploadText>퀴즈를 만들 파일을 드래그하거나 클릭하여 업로드</S.UploadText>
            <S.SupportedFilesText>PDF, PPT 파일을 지원합니다.</S.SupportedFilesText>
            
            <S.FileInput
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.ppt,.pptx"
            />
            
            <S.FileSelectButton type="button" onClick={onFileSelectClick}>
                파일 선택
            </S.FileSelectButton>

            {file && (
                <S.SelectedFileText>
                    선택된 파일: {file.name}
                </S.SelectedFileText>
            )}
        </S.UploadArea>
                {file && (
                    <button onClick={handleFileUpload} disabled={createQuizMutation.isLoading} style={{width: '100%', padding: '14px', fontSize: '1.1rem', backgroundColor: '#0059ff', color: 'white', border: 'none', borderRadius: '8px'}}>
                        {createQuizMutation.isLoading ? '생성 중...' : '이 파일로 퀴즈 생성하기'}
                    </button>
                )}
            </S.SectionCard>

            <S.SectionCard>
                <h2>퀴즈 목록</h2>
                {isQuizzesLoading ? (
                    <p>퀴즈 목록을 불러오는 중입니다...</p>
                ) : isError ? (
                    <p>퀴즈 목록을 불러오는 데 실패했습니다.</p>
                ) : quizzes.length > 0 ? (
                    quizzes.map((quiz) => (
                        // 🔥 5. 퀴즈 아이템 UI 수정
                        <S.QuizListItem key={quiz.quizId}>
                            <div onClick={() => navigate(`/main/quiz/${quiz.quizId}`)} style={{ flexGrow: 1, cursor: 'pointer' }}>
                                <h3>{quiz.title}</h3>
                                <p>최근 점수: {quiz.latestScore !== null ? `${quiz.latestScore.toFixed(0)}점` : '미응시'}</p>
                            </div>
                            {/* 🔥 삭제 버튼 추가 */}
                            <S.DeleteButton onClick={(e) => handleDeleteQuiz(e, quiz.quizId)}>
                                🗑️
                            </S.DeleteButton>
                        </S.QuizListItem>
                    ))
                ) : (
                    <p>생성된 퀴즈가 없습니다.</p>
                )}
            </S.SectionCard>
        </S.PageContainer>
    );
};

export default QuizListPage;