import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../../api/api.js';
import * as S from './quiz.style.jsx';

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [scoreData, setScoreData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      setIsLoading(true);
      try {
        const response = await api.getQuizById(quizId);
        setQuiz(response.data.data);
        if (response.data.data && response.data.data.questions) {
          setUserAnswers(new Array(response.data.data.questions.length).fill(null));
        }
      } catch (error) {
        console.error("퀴즈를 불러오는데 실패했습니다.", error);
        setQuiz(null);
      } finally {
        setIsLoading(false);
      }
    };
    if (quizId) {
        fetchQuiz();
    }
  }, [quizId]);

  const handleAnswerSelect = (selectedOption) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedOption;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await api.submitQuizAnswers(quizId, {
        questionSetId: quiz.questionSetId,
        userAnswers: userAnswers,
        timeTaken: 120
      });
      setScoreData(response.data.data);
    } catch (error) {
      console.error("답안 제출에 실패했습니다.", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <S.Container><h2>로딩 중...</h2></S.Container>;
  }

  if (scoreData) {
    return (
      <S.Container>
        <S.ResultCard>
          <h1>퀴즈 결과</h1>
          <h2>{scoreData.score.toFixed(0)}점</h2>
          <S.ActionButton onClick={() => navigate('/main/quiz')}>
            목록으로 돌아가기
          </S.ActionButton>
        </S.ResultCard>
      </S.Container>
    );
  }
  
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return <S.Container><h2>퀴즈를 찾을 수 없습니다.</h2></S.Container>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <S.Container>
      <h1>{quiz.title}</h1>
      <S.Card>
        <S.QuestionText>Q{currentQuestionIndex + 1}. {currentQuestion.questionText}</S.QuestionText>
        <S.OptionsContainer>
          {currentQuestion.options.map((option, index) => (
            <S.OptionButton
              key={index}
              selected={userAnswers[currentQuestionIndex] === option}
              onClick={() => handleAnswerSelect(option)}
            >
              {option}
            </S.OptionButton>
          ))}
        </S.OptionsContainer>
        <S.NavigationButtons>
          {isLastQuestion ? (
            <S.ActionButton onClick={handleSubmit} disabled={userAnswers.includes(null)}>
              제출하기
            </S.ActionButton>
          ) : (
            <S.ActionButton onClick={handleNext} disabled={userAnswers[currentQuestionIndex] === null}>
              다음 문제
            </S.ActionButton>
          )}
        </S.NavigationButtons>
      </S.Card>
    </S.Container>
  );
};

export default QuizPage;