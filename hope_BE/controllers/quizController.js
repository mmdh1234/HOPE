const Quiz = require('../models/quizModel');
const QuestionSet = require('../models/questionSetModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PDFExtract } = require('pdf.js-extract');
const mammoth = require('mammoth');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//파일에서 텍스트 추출 부분 ---
const extractTextFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const filePath = file.path;
    const extension = file.originalname.split('.').pop().toLowerCase();

    if (extension === 'pdf') {
      const pdfExtract = new PDFExtract();
      pdfExtract.extract(filePath, {}, (err, data) => {
        if (err) return reject(err);
        const text = data.pages.map(page => 
            page.content.map(item => item.str).join(' ')
        ).join('\n');
        fs.unlinkSync(filePath);
        resolve(text);
      });
    } else if (extension === 'pptx') {
      mammoth.extractRawText({ path: filePath })
        .then(result => {
          fs.unlinkSync(filePath); 
          resolve(result.value);
        })
        .catch(reject);
    } else {
      fs.unlinkSync(filePath); 
      reject(new Error('지원하지 않는 파일 형식입니다.'));
    }
  });
};

// Gemini API로 퀴즈 생성 part여---
const generateQuizWithGemini = async (text) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
  const prompt = `
    다음 텍스트를 기반으로 객관식 문제 5개를 생성해줘.
    각 문제는 questionText, options (4개의 보기 배열), correctAnswer 필드를 가져야 해.
    반드시 유효한 JSON 형식의 배열([])으로만 응답해야 하며, 다른 설명은 포함하지 마.
    ---
    ${text.substring(0, 8000)}
    ---
  `;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const jsonResponse = response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(jsonResponse);
};

// 1. 퀴즈 생성
exports.createQuiz = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, message: '파일이 업로드되지 않았습니다.' });
  }

  try {
    const text = await extractTextFromFile(req.file);
    const quizData = await generateQuizWithGemini(text); // quizData는 문제 객체의 배열

    const newQuiz = new Quiz({
      userId: req.user.id,
      title: req.file.originalname,
      originalFilename: req.file.originalname,
      sourceFileUrl: req.file.path,
    });
    await newQuiz.save();

    const newQuestionSet = new QuestionSet({
      quizId: newQuiz._id,
      questions: quizData, // quizData는 배열--> 그대로 사용
    });
    await newQuestionSet.save();

    res.status(201).json({
      ok: true,
      message: '퀴즈가 성공적으로 생성되었습니다.',
      data: {
        quizId: newQuiz._id,
        title: newQuiz.title,
      },
    });
  } catch (error) {
    console.error('퀴즈 생성 실패:', error);
    res.status(500).json({ ok: false, message: '서버 오류가 발생했습니다.', error: error.message });
  }
};

// 2. 퀴즈 목록 조회
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.user.id }).sort({ createdAt: -1 });
    if (!quizzes || quizzes.length === 0) {
      return res.status(200).json({ ok: true, message: '생성된 퀴즈가 없습니다.', data: [] });
    }
    res.status(200).json({
      ok: true,
      message: '퀴즈 목록을 성공적으로 조회했습니다.',
      data: quizzes.map(q => ({
        quizId: q._id,
        title: q.title,
        latestScore: q.latestScore,
        latestTimeTaken: q.latestTimeTaken,
        createdAt: q.createdAt,
      }))
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: '서버 오류 발생' });
  }
};

// 3. 특정 퀴즈 조회
exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ ok: false, message: '퀴즈를 찾을 수 없습니다.' });
    }
    const latestQuestionSet = await QuestionSet.findOne({ quizId }).sort({ createdAt: -1 });
    if (!latestQuestionSet) {
      return res.status(404).json({ ok: false, message: '문제 세트를 찾을 수 없습니다.' });
    }
    
    const questionsForClient = latestQuestionSet.questions.map(q => ({
      questionText: q.questionText,
      options: q.options
    }));

    res.status(200).json({
      ok: true,
      message: '퀴즈 문제를 성공적으로 조회했습니다.',
      data: {
        title: quiz.title,
        questions: questionsForClient,
        questionSetId: latestQuestionSet._id
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: '서버 오류 발생' });
  }
};

// 4. 퀴즈 답안 제출
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { userAnswers, timeTaken, questionSetId } = req.body;

    const questionSet = await QuestionSet.findById(questionSetId);
    if (!questionSet) {
      return res.status(404).json({ ok: false, message: '문제 세트를 찾을 수 없습니다.' });
    }

    let score = 0;
    const correctAnswers = questionSet.questions.map(q => q.correctAnswer);

    if (userAnswers.length !== correctAnswers.length) {
      return res.status(400).json({ ok: false, message: '제출된 답안 수가 올바르지 않습니다.' });
    }

    userAnswers.forEach((answer, index) => {
      if (answer === correctAnswers[index]) {
        score += (100 / correctAnswers.length);
      }
    });

    questionSet.score = score;
    questionSet.timeTaken = timeTaken;
    await questionSet.save();

    await Quiz.findByIdAndUpdate(quizId, {
      latestScore: score,
      latestTimeTaken: timeTaken,
    });

    res.status(200).json({
      ok: true,
      message: '채점이 완료되었습니다.',
      data: {
        score,
        timeTaken,
        correctAnswers,
        userAnswers,
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: '서버 오류 발생' });
  }
};

// 5. 새 문제 생성
exports.regenerateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const originalQuiz = await Quiz.findById(quizId);
    if (!originalQuiz) {
      return res.status(404).json({ ok: false, message: '원본 퀴즈를 찾을 수 없습니다.' });
    }
    
    const file = {
      path: originalQuiz.sourceFileUrl,
      originalname: originalQuiz.originalFilename,
    };
    const text = await extractTextFromFile(file);
    const quizData = await generateQuizWithGemini(text);

    const newQuestionSet = new QuestionSet({
      quizId: originalQuiz._id,
      questions: quizData,
    });
    await newQuestionSet.save();

    const questionsForClient = newQuestionSet.questions.map(q => ({
      questionText: q.questionText,
      options: q.options
    }));

    res.status(201).json({
      ok: true,
      message: '새로운 문제를 생성했습니다.',
      data: {
        title: originalQuiz.title,
        questions: questionsForClient,
        questionSetId: newQuestionSet._id
      }
    });

  } catch (error) {
    console.error('새 문제 생성 실패:', error);
    res.status(500).json({ ok: false, message: '새 문제 생성에 실패했습니다.', error: error.message });
  }
};