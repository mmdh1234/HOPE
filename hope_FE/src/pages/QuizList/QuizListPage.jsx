import React, { useState, useEffect, useCallback, useRef } from 'react'; // useCallback, useRef 추가
import { useNavigate } from 'react-router-dom';
import * as api from '../../api/api';
import * as S from './QuizListPage.style'; 

const QuizListPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null); // 파일 input에 접근하기 위한 ref

  // --- 드래그 앤 드롭 관련 함수들 추가 ---
  const onDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
        setFile(files[0]);
    }
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onFileSelectClick = () => {
    fileInputRef.current.click();
  };

  // --- 기존 함수들 ---
  const fetchQuizzes = async () => {
    try {
      const response = await api.getQuizzes();
      setQuizzes(response.data.data);
    } catch (err) {
      setError('퀴즈 목록을 불러오는 데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleFileUpload = async () => {
    if (!file) return alert('파일을 선택해주세요.');
    setIsLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.createQuiz(formData);
      alert('퀴즈가 성공적으로 생성되었습니다!');
      setFile(null); // 업로드 성공 후 선택된 파일 초기화
      fetchQuizzes();
    } catch (err) {
      setError('퀴즈 생성에 실패했습니다. 파일 형식을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <S.PageContainer>
      <h1>나의 퀴즈</h1>

      {/* --- '새 퀴즈 만들기' 섹션 UI 변경 --- */}
      <S.SectionCard>
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

        {/* 파일이 선택되었을 때만 '퀴즈 생성하기' 버튼이 보이도록 변경 */}
        {file && (
            <button onClick={handleFileUpload} disabled={isLoading} style={{width: '100%', padding: '14px', fontSize: '1.1rem', backgroundColor: '#0059ff', color: 'white', border: 'none', borderRadius: '8px'}}>
                {isLoading ? '생성 중...' : '이 파일로 퀴즈 생성하기'}
            </button>
        )}

        {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
      </S.SectionCard>

      <S.SectionCard>
        <h2>퀴즈 목록</h2>
        {quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <S.QuizListItem
              key={quiz.quizId}
              onClick={() => navigate(`/main/quiz/${quiz.quizId}`)}
            >
              <h3>{quiz.title}</h3>
              <p>최근 점수: {quiz.latestScore !== null ? `${quiz.latestScore.toFixed(0)}점` : '미응시'}</p>
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