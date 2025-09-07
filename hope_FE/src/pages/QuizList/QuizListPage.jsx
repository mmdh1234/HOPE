import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../api/api';
import './QuizListPage.css';

const QuizListPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      fetchQuizzes(); // 목록 새로고침
    } catch (err) {
      setError('퀴즈 생성에 실패했습니다. 파일 형식을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="quiz-list-container">
      <h1>나의 퀴즈</h1>
      <div className="file-upload-section">
        <h2>새 퀴즈 만들기</h2>
        <input type="file" onChange={handleFileChange} accept=".pdf,.ppt,.pptx" />
        <button onClick={handleFileUpload} disabled={isLoading}>
          {isLoading ? '생성 중...' : '퀴즈 생성하기'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </div>

      <div className="quiz-list">
        <h2>퀴즈 목록</h2>
        {quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <div
              key={quiz.quizId}
              className="quiz-list-item"
              onClick={() => navigate(`/main/quiz/${quiz.quizId}`)}
            >
              <h3>{quiz.title}</h3>
              <p>최근 점수: {quiz.latestScore !== null ? `${quiz.latestScore.toFixed(0)}점` : '미응시'}</p>
            </div>
          ))
        ) : (
          <p>생성된 퀴즈가 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default QuizListPage;