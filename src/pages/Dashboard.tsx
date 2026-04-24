import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTestsBySpecialty, getResultsByUser } from '../services/storage';
import { Test, TestResult, SPECIALTIES } from '../types';
import {
  LogOut, Play, Clock, CheckCircle, Award, FileText, TrendingUp, User as UserIcon
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'results'>('tests');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isAdmin) {
      navigate('/admin');
      return;
    }

    const loadData = async () => {
      if (user) {
        try {
          const [availableTests, userResults] = await Promise.all([
            getTestsBySpecialty(user.specialty),
            getResultsByUser(user.id)
          ]);
          setTests(availableTests);
          setResults(userResults);
        } catch (error) {
          console.error('Ошибка загрузки данных:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [isAuthenticated, isAdmin, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getSpecialtyName = (id: string) => {
    return SPECIALTIES.find(s => s.id === id)?.name || id;
  };

  const getAverageScore = () => {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + (r.correctAnswers / r.totalQuestions) * 100, 0);
    return Math.round(total / results.length);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">{user.fullName}</h1>
              <p className="text-blue-300 text-sm">{getSpecialtyName(user.specialty)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-blue-300 rounded-lg transition-colors text-sm"
            >
              Редактировать профиль
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Доступно тестов</p>
                <p className="text-3xl font-bold text-white">{tests.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Пройдено тестов</p>
                <p className="text-3xl font-bold text-white">{results.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Средний результат</p>
                <p className="text-3xl font-bold text-white">{getAverageScore()}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'tests' ? 'bg-blue-500 text-white' : 'bg-white/10 text-blue-300 hover:bg-white/20'
            }`}
          >
            Доступные тесты
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'results' ? 'bg-blue-500 text-white' : 'bg-white/10 text-blue-300 hover:bg-white/20'
            }`}
          >
            Мои результаты
          </button>
        </div>

        {activeTab === 'tests' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FileText className="w-16 h-16 text-blue-300/30 mx-auto mb-4" />
                <p className="text-blue-300">Для вашей специальности пока нет тестов</p>
              </div>
            ) : (
              tests.map((test) => {
                const completed = results.some(r => r.testId === test.id);
                const result = results.find(r => r.testId === test.id);
                return (
                  <div key={test.id} className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10 hover:border-blue-400/30 transition-all">
                    <h3 className="text-xl font-semibold text-white mb-2">{test.title}</h3>
                    <p className="text-blue-300 text-sm mb-4">{test.description}</p>
                    <div className="flex items-center gap-4 text-sm text-blue-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {test.timeLimit} мин
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {test.questions.length} вопросов
                      </span>
                    </div>
                    {completed ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-5 h-5" />
                          <span>Пройдено</span>
                        </div>
                        <p className="text-white font-semibold">
                          Результат: {result?.correctAnswers}/{result?.totalQuestions}
                          ({Math.round(((result?.correctAnswers || 0) / (result?.totalQuestions || 1)) * 100)}%)
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/test/${test.id}`)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Начать тест
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-blue-300/30 mx-auto mb-4" />
                <p className="text-blue-300">Вы еще не проходили тесты</p>
              </div>
            ) : (
              results
                .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                .map((result) => (
                  <div key={result.id} className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{result.testTitle}</h3>
                        <p className="text-blue-300 text-sm">
                          {new Date(result.completedAt).toLocaleDateString('ru-RU', {
                            day: '2-digit', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">
                          {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
                        </p>
                        <p className="text-blue-400 text-sm">
                          {result.correctAnswers} из {result.totalQuestions} правильно
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;