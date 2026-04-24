

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTests, saveResult, getResultsByUser } from '../services/storage';
import { Test, Question, TestResult } from '../types';
import {
  Clock, ChevronLeft, ChevronRight, Flag,
  CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
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
  const [finalAnswers, setFinalAnswers] = useState<number[]>([]);

  // Для разбора ошибок
  const [showReview, setShowReview] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'wrong' | 'correct'>('all');

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
    setFinalAnswers([...answers]);
  }, [test, user, answers, startTime, isFinished]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => answers.filter(a => a !== -1).length;

  // Фильтрация вопросов для разбора
  const getFilteredQuestions = () => {
    if (!test) return [];
    return test.questions.map((q, index) => ({
      question: q,
      index,
      userAnswer: finalAnswers[index],
      isCorrect: finalAnswers[index] === q.correctAnswer,
      isSkipped: finalAnswers[index] === -1
    })).filter(item => {
      if (filterMode === 'wrong') return !item.isCorrect;
      if (filterMode === 'correct') return item.isCorrect;
      return true;
    });
  };

  if (loading || !test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  // Экран результатов
  if (isFinished && result) {
    const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
    const isPassed = percentage >= 70;
    const wrongCount = result.totalQuestions - result.correctAnswers;
    const filteredQuestions = getFilteredQuestions();

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-8">

          {/* Карточка результата */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-6">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
                isPassed ? 'bg-green-500' : 'bg-orange-500'
              }`}>
                {isPassed
                  ? <CheckCircle className="w-10 h-10 text-white" />
                  : <AlertCircle className="w-10 h-10 text-white" />
                }
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {isPassed ? 'Тест пройден!' : 'Тест завершен'}
              </h2>
              <p className="text-blue-200">
                {isPassed
                  ? 'Отличный результат! Вы показали хорошие знания.'
                  : 'Рекомендуем повторить материал и попробовать снова.'}
              </p>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-blue-300 text-sm mb-1">Результат</p>
                <p className={`text-3xl font-bold ${isPassed ? 'text-green-400' : 'text-orange-400'}`}>
                  {percentage}%
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-blue-300 text-sm mb-1">Правильно</p>
                <p className="text-3xl font-bold text-green-400">{result.correctAnswers}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-blue-300 text-sm mb-1">Неверно</p>
                <p className="text-3xl font-bold text-red-400">{wrongCount}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-blue-300 text-sm mb-1">Время</p>
                <p className="text-3xl font-bold text-white">{formatTime(result.timeSpent)}</p>
              </div>
            </div>

            {/* Полоска прогресса */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-blue-300 mb-2">
                <span>Правильных ответов</span>
                <span>{result.correctAnswers} из {result.totalQuestions}</span>
              </div>
              <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isPassed ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-blue-400 mt-1">
                <span>0%</span>
                <span className="text-yellow-400">Зачет: 70%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Статус */}
            <div className={`p-4 rounded-xl text-center mb-6 ${
              isPassed ? 'bg-green-500/20 border border-green-500/30' : 'bg-orange-500/20 border border-orange-500/30'
            }`}>
              <p className={`text-lg font-semibold ${isPassed ? 'text-green-300' : 'text-orange-300'}`}>
                {isPassed ? '✅ Зачет' : '❌ Не зачет'}
              </p>
              {!isPassed && (
                <p className="text-orange-200 text-sm mt-1">
                  Для зачета необходимо набрать минимум 70%
                </p>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowReview(!showReview)}
                className="flex-1 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium rounded-lg transition-colors border border-blue-500/30"
              >
                {showReview ? 'Скрыть разбор' : '📋 Разбор ошибок'}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
              >
                В личный кабинет
              </button>
            </div>
          </div>

          {/* Блок разбора ошибок */}
          {showReview && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Разбор ответов</h3>

                {/* Фильтры */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterMode === 'all'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-blue-300 hover:bg-white/20'
                    }`}
                  >
                    Все ({test.questions.length})
                  </button>
                  <button
                    onClick={() => setFilterMode('wrong')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterMode === 'wrong'
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-blue-300 hover:bg-white/20'
                    }`}
                  >
                    ❌ Неверные ({wrongCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('correct')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterMode === 'correct'
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-blue-300 hover:bg-white/20'
                    }`}
                  >
                    ✅ Верные ({result.correctAnswers})
                  </button>
                </div>
              </div>

              {/* Список вопросов */}
              <div className="divide-y divide-white/10">
                {filteredQuestions.length === 0 ? (
                  <div className="p-8 text-center text-blue-300">
                    Нет вопросов в этой категории
                  </div>
                ) : (
                  filteredQuestions.map(({ question, index, userAnswer, isCorrect, isSkipped }) => (
                    <div key={question.id} className="p-4">
                      {/* Заголовок вопроса */}
                      <button
                        onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                        className="w-full flex items-center justify-between gap-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          {/* Иконка статуса */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isSkipped
                              ? 'bg-gray-500/30'
                              : isCorrect
                                ? 'bg-green-500/30'
                                : 'bg-red-500/30'
                          }`}>
                            {isSkipped ? (
                              <span className="text-gray-400 text-xs">—</span>
                            ) : isCorrect ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          <div>
                            <span className="text-blue-400 text-xs">Вопрос {index + 1}</span>
                            <p className="text-white text-sm font-medium">{question.text}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isSkipped && (
                            <span className="text-xs px-2 py-1 bg-gray-500/20 text-gray-400 rounded">
                              Пропущен
                            </span>
                          )}
                          {!isSkipped && isCorrect && (
                            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                              Верно
                            </span>
                          )}
                          {!isSkipped && !isCorrect && (
                            <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                              Неверно
                            </span>
                          )}
                          {expandedQuestion === index
                            ? <ChevronUp className="w-4 h-4 text-blue-400" />
                            : <ChevronDown className="w-4 h-4 text-blue-400" />
                          }
                        </div>
                      </button>

                      {/* Раскрытый разбор */}
                      {expandedQuestion === index && (
                        <div className="mt-4 ml-11 space-y-2">
                          {question.options.map((option, optIndex) => {
                            const isUserAnswer = userAnswer === optIndex;
                            const isCorrectAnswer = question.correctAnswer === optIndex;

                            let bgClass = 'bg-white/5 border-white/10';
                            let textClass = 'text-blue-300';
                            let badge = null;

                            if (isCorrectAnswer && isUserAnswer) {
                              // Правильный и выбранный
                              bgClass = 'bg-green-500/20 border-green-500/40';
                              textClass = 'text-green-300';
                              badge = (
                                <span className="text-xs px-2 py-0.5 bg-green-500/30 text-green-300 rounded ml-2">
                                  ✓ Ваш ответ
                                </span>
                              );
                            } else if (isCorrectAnswer) {
                              // Правильный но не выбранный
                              bgClass = 'bg-green-500/10 border-green-500/30';
                              textClass = 'text-green-400';
                              badge = (
                                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded ml-2">
                                  ✓ Правильный ответ
                                </span>
                              );
                            } else if (isUserAnswer && !isCorrectAnswer) {
                              // Выбранный но неправильный
                              bgClass = 'bg-red-500/20 border-red-500/40';
                              textClass = 'text-red-300';
                              badge = (
                                <span className="text-xs px-2 py-0.5 bg-red-500/30 text-red-300 rounded ml-2">
                                  ✗ Ваш ответ
                                </span>
                              );
                            }

                            return (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-3 p-3 rounded-lg border ${bgClass}`}
                              >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  isCorrectAnswer
                                    ? 'border-green-500 bg-green-500/20'
                                    : isUserAnswer
                                      ? 'border-red-500 bg-red-500/20'
                                      : 'border-white/20'
                                }`}>
                                  <span className={`text-xs font-bold ${
                                    isCorrectAnswer ? 'text-green-400' : isUserAnswer ? 'text-red-400' : 'text-blue-400'
                                  }`}>
                                    {String.fromCharCode(65 + optIndex)}
                                  </span>
                                </div>
                                <span className={`text-sm flex-1 ${textClass}`}>{option}</span>
                                {badge}
                              </div>
                            );
                          })}

                          {/* Сообщение если вопрос пропущен */}
                          {isSkipped && (
                            <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                              <p className="text-gray-400 text-sm">
                                ⚠️ Вопрос был пропущен. Правильный ответ выделен зеленым.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Кнопка внизу */}
              <div className="p-6 border-t border-white/10">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Вернуться в личный кабинет
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Экран прохождения теста
  const currentQuestion: Question = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-semibold">{test.title}</h1>
              <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-blue-300 text-sm mt-1">
                Вопрос {currentQuestionIndex + 1} из {test.questions.length}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeLeft < 60 ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Вопрос */}
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
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    answers[currentQuestionIndex] === index
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-white/30'
                  }`}>
                    {answers[currentQuestionIndex] === index
                      ? <div className="w-3 h-3 bg-white rounded-full" />
                      : <span className="text-xs text-white/50">{String.fromCharCode(65 + index)}</span>
                    }
                  </div>
                  <span className="text-white">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Навигация */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Назад
          </button>

          {/* Точки вопросов */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {test.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-blue-500 scale-125'
                    : answers[index] !== -1
                      ? 'bg-green-400'
                      : 'bg-white/20'
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
          <p className="text-blue-300 text-sm">
            Отвечено {getAnsweredCount()} из {test.questions.length} вопросов
          </p>
        </div>
      </main>

      {/* Модалка подтверждения */}
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
              <button
                onClick={() => setShowConfirmFinish(false)}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
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