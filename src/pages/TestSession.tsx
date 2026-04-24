import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTests, saveResult, getResultsByUser } from '../services/storage';
import { Test, Question, TestResult } from '../types';
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const TestSession: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadTest = async () => {
      try {
        const tests = await getTests();
        const foundTest = tests.find(t => t.id === testId);
        if (!foundTest) {
          navigate('/dashboard');
          return;
        }
        const userResults = await getResultsByUser(user.id);
        if (userResults.some(r => r.testId === testId)) {
          navigate('/dashboard');
          return;
        }
        setTest(foundTest);
        setAnswers(new Array(foundTest.questions.length).fill(-1));
        setTimeLeft(foundTest.timeLimit * 60);
        setStartTime(Date.now());
      } catch (error) {
        console.error('Ошибка загрузки теста:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId, user, navigate]);

  useEffect(() => {
    if (timeLeft <= 0 || isFinished || !test) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished, test]);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleFinish = useCallback(async () => {
    if (!test || !user || isFinished) return;
    setIsFinished(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    let correctCount = 0;
    test.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) correctCount++;
    });
    const testResult: TestResult = {
      id: uuidv4(),
      userId: user.id,
      testId: test.id,
      testTitle: test.title,
      userName: user.fullName,
      specialty: user.specialty,
      score: Math.round((correctCount / test.questions.length) * 100),
      totalQuestions: test.questions.length,
      correctAnswers: correctCount,
      completedAt: new Date().toISOString(),
      timeSpent
    };
    await saveResult(testResult);
    setResult(testResult);
  }, [test, user, answers, startTime, isFinished]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => answers.filter(a => a !== -1).length;

  if (loading || !test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (isFinished && result) {
    const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
    const isPassed = percentage >= 70;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${isPassed ? 'bg-green-500' : 'bg-orange-500'}`}>
              {isPassed ? <CheckCircle className="w-10 h-10 text-white" /> : <AlertCircle className="w-10 h-10 text-white" />}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{isPassed ? 'Тест пройден!' : 'Тест завершен'}</h2>
            <p className="text-blue-200 mb-6">
              {isPassed ? 'Отличный результат! Вы показали хорошие знания.' : 'Рекомендуем повторить материал.'}
            </p>
            <div className="bg-white/10 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-300 text-sm">Правильных ответов</p>
                  <p className="text-2xl font-bold text-white">{result.correctAnswers}/{result.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-blue-300 text-sm">Процент</p>
                  <p className={`text-2xl font-bold ${isPassed ? 'text-green-400' : 'text-orange-400'}`}>{percentage}%</p>
                </div>
                <div>
                  <p className="text-blue-300 text-sm">Затраченное время</p>
                  <p className="text-2xl font-bold text-white">{formatTime(result.timeSpent)}</p>
                </div>
                <div>
                  <p className="text-blue-300 text-sm">Статус</p>
                  <p className={`text-lg font-semibold ${isPassed ? 'text-green-400' : 'text-orange-400'}`}>
                    {isPassed ? 'Зачет' : 'Не зачет'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
            >
              Вернуться в личный кабинет
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion: Question = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-semibold">{test.title}</h1>
              <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-blue-300 text-sm mt-1">Вопрос {currentQuestionIndex + 1} из {test.questions.length}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white'}`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur rounded-xl p-8 border border-white/20 mb-6">
          <h2 className="text-xl text-white font-medium mb-6">{currentQuestion.text}</h2>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  answers[currentQuestionIndex] === index
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/10 hover:border-blue-400/50 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${answers[currentQuestionIndex] === index ? 'border-blue-500 bg-blue-500' : 'border-white/30'}`}>
                    {answers[currentQuestionIndex] === index && <div className="w-3 h-3 bg-white rounded-full" />}
                  </div>
                  <span className="text-white">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Назад
          </button>

          <div className="flex items-center gap-2">
            {test.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentQuestionIndex ? 'bg-blue-500' : answers[index] !== -1 ? 'bg-green-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {currentQuestionIndex < test.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(test.questions.length - 1, prev + 1))}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Далее
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmFinish(true)}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
            >
              <Flag className="w-4 h-4" />
              Завершить
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-blue-300 text-sm">Отвечено {getAnsweredCount()} из {test.questions.length} вопросов</p>
        </div>
      </main>

      {showConfirmFinish && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">Завершить тест?</h3>
            <p className="text-blue-300 mb-6">
              {getAnsweredCount() < test.questions.length
                ? `Вы ответили только на ${getAnsweredCount()} из ${test.questions.length} вопросов. `
                : ''}
              После завершения тест нельзя будет перепройти.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmFinish(false)} className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                Продолжить
              </button>
              <button
                onClick={() => { setShowConfirmFinish(false); handleFinish(); }}
                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSession;