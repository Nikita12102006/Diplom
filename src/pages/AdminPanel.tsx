import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTests, saveTest, deleteTest, updateTest,
  getResults, getUsers, deleteResultByUserAndTest
} from '../services/storage';
import { Test, TestResult, Question, SPECIALTIES, EDUCATION_LEVELS } from '../types';
import {
  LogOut, Plus, Trash2, FileText, Users, BarChart3,
  Clock, HelpCircle, X, Check, ChevronDown, ChevronUp,
  Award, Edit, Save, RotateCcw
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface TestForm {
  title: string;
  description: string;
  specialty: string;
  timeLimit: number;
  questions: Question[];
}

const emptyForm: TestForm = {
  title: '',
  description: '',
  specialty: '',
  timeLimit: 30,
  questions: []
};

const emptyQuestion: Question = {
  id: '',
  text: '',
  options: ['', '', '', ''],
  correctAnswer: 0
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Не указана';
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
};

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'results' | 'users'>('tests');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const [form, setForm] = useState<TestForm>(emptyForm);
  const [newQuestion, setNewQuestion] = useState<Question>(emptyQuestion);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/dashboard'); return; }
    loadData();
  }, [isAuthenticated, isAdmin, navigate]);

  const loadData = async () => {
    try {
      const [testsData, resultsData, usersData] = await Promise.all([
        getTests(), getResults(), getUsers()
      ]);
      setTests(testsData);
      setResults(resultsData);
      setUsers(usersData.filter((u: any) => u.role === 'user'));
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const openCreateModal = () => {
    setEditingTest(null);
    setForm(emptyForm);
    setNewQuestion(emptyQuestion);
    setShowModal(true);
  };

  const openEditModal = (test: Test) => {
    setEditingTest(test);
    setForm({
      title: test.title,
      description: test.description,
      specialty: test.specialty,
      timeLimit: test.timeLimit,
      questions: [...test.questions]
    });
    setNewQuestion(emptyQuestion);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTest(null);
    setForm(emptyForm);
    setNewQuestion(emptyQuestion);
  };

  const handleDeleteTest = async (testId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот тест?')) {
      await deleteTest(testId);
      loadData();
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.text.trim() || newQuestion.options.some(o => !o.trim())) {
      alert('Заполните вопрос и все варианты ответов');
      return;
    }
    const question: Question = { ...newQuestion, id: uuidv4() };
    setForm({ ...form, questions: [...form.questions, question] });
    setNewQuestion(emptyQuestion);
  };

  const handleRemoveQuestion = (index: number) => {
    setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) });
  };

  const handleSaveTest = async () => {
    if (!form.title.trim() || !form.specialty || form.questions.length === 0) {
      alert('Заполните название, специальность и добавьте хотя бы один вопрос');
      return;
    }

    if (editingTest) {
      const updated: Test = {
        ...editingTest,
        title: form.title,
        description: form.description,
        specialty: form.specialty,
        timeLimit: form.timeLimit,
        questions: form.questions
      };
      await updateTest(updated);
    } else {
      const test: Test = {
        id: uuidv4(),
        title: form.title,
        description: form.description,
        specialty: form.specialty,
        timeLimit: form.timeLimit,
        questions: form.questions,
        createdAt: new Date().toISOString()
      };
      await saveTest(test);
    }

    loadData();
    closeModal();
  };

  const handleResetResult = async (userId: string, testId: string, userName: string) => {
    if (confirm(`Разрешить пересдачу для пользователя ${userName}?`)) {
      await deleteResultByUserAndTest(userId, testId);
      loadData();
    }
  };

  const getSpecialtyName = (id: string) => SPECIALTIES.find(s => s.id === id)?.name || id;
  const getTestResults = (testId: string) => results.filter(r => r.testId === testId);
  const getAverageScore = (testId: string) => {
    const tr = getTestResults(testId);
    if (tr.length === 0) return 0;
    return Math.round(
      tr.reduce((sum, r) => sum + (r.correctAnswers / r.totalQuestions) * 100, 0) / tr.length
    );
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

      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">Административная панель</h1>
              <p className="text-blue-300 text-sm">Управление тестированием</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Всего тестов', value: tests.length, icon: FileText, color: 'blue' },
            { label: 'Кандидатов', value: users.length, icon: Users, color: 'green' },
            { label: 'Всего прохождений', value: results.length, icon: BarChart3, color: 'purple' },
            {
              label: 'Средний результат',
              value: results.length > 0
                ? `${Math.round(results.reduce((sum, r) => sum + (r.correctAnswers / r.totalQuestions) * 100, 0) / results.length)}%`
                : '0%',
              icon: Award,
              color: 'orange'
            }
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm">{label}</p>
                  <p className="text-3xl font-bold text-white">{value}</p>
                </div>
                <div className={`w-12 h-12 bg-${color}-500/20 rounded-full flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {(['tests', 'results', 'users'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-blue-300 hover:bg-white/20'
              }`}
            >
              {tab === 'tests' ? 'Тесты' : tab === 'results' ? 'Результаты' : 'Пользователи'}
            </button>
          ))}
        </div>

        {/* ===== ТЕСТЫ ===== */}
        {activeTab === 'tests' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Управление тестами</h2>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Создать тест
              </button>
            </div>

            <div className="space-y-4">
              {tests.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl">
                  <FileText className="w-16 h-16 text-blue-300/30 mx-auto mb-4" />
                  <p className="text-blue-300">Тесты еще не созданы</p>
                </div>
              ) : (
                tests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-white/10 backdrop-blur rounded-xl border border-white/10 overflow-hidden"
                  >
                    <div
                      className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                    >
                      <div>
                        <h3 className="text-xl font-semibold text-white">{test.title}</h3>
                        <p className="text-blue-300 text-sm mt-1">{test.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-blue-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />{test.timeLimit} мин
                          </span>
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-4 h-4" />{test.questions.length} вопросов
                          </span>
                          <span className="px-2 py-1 bg-blue-500/20 rounded text-xs">
                            {getSpecialtyName(test.specialty)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />{getTestResults(test.id).length} прохождений
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4" />Средний: {getAverageScore(test.id)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(test); }}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                          title="Редактировать тест"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteTest(test.id); }}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                          title="Удалить тест"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        {expandedTest === test.id
                          ? <ChevronUp className="w-5 h-5 text-blue-400" />
                          : <ChevronDown className="w-5 h-5 text-blue-400" />
                        }
                      </div>
                    </div>

                    {expandedTest === test.id && (
                      <div className="border-t border-white/10 p-6 bg-white/5">
                        <h4 className="text-lg font-semibold text-white mb-4">Вопросы теста:</h4>
                        <div className="space-y-4">
                          {test.questions.map((q, index) => (
                            <div key={q.id} className="bg-white/5 rounded-lg p-4">
                              <p className="text-white font-medium mb-3">{index + 1}. {q.text}</p>
                              <div className="space-y-2">
                                {q.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`flex items-center gap-2 p-2 rounded ${
                                      optIndex === q.correctAnswer
                                        ? 'bg-green-500/20 text-green-300'
                                        : 'text-blue-300'
                                    }`}
                                  >
                                    {optIndex === q.correctAnswer && <Check className="w-4 h-4" />}
                                    <span>{option}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===== РЕЗУЛЬТАТЫ ===== */}
        {activeTab === 'results' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Результаты тестирования</h2>
            {results.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl">
                <Award className="w-16 h-16 text-blue-300/30 mx-auto mb-4" />
                <p className="text-blue-300">Результатов пока нет</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results
                  .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                  .map((result) => (
                    <div
                      key={result.id}
                      className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{result.testTitle}</h3>
                          <p className="text-blue-300 text-sm">
                            {result.userName} • {getSpecialtyName(result.specialty)}
                          </p>
                          <p className="text-blue-400 text-xs mt-1">
                            {new Date(result.completedAt).toLocaleDateString('ru-RU', {
                              day: '2-digit', month: 'long', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${
                              (result.correctAnswers / result.totalQuestions) >= 0.7
                                ? 'text-green-400'
                                : 'text-orange-400'
                            }`}>
                              {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
                            </p>
                            <p className="text-blue-400 text-sm">
                              {result.correctAnswers} из {result.totalQuestions}
                            </p>
                          </div>
                          <button
                            onClick={() => handleResetResult(result.userId, result.testId, result.userName)}
                            className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-colors text-sm"
                            title="Разрешить пересдачу"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Пересдача
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ===== ПОЛЬЗОВАТЕЛИ ===== */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Пользователи</h2>
            {users.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl">
                <Users className="w-16 h-16 text-blue-300/30 mx-auto mb-4" />
                <p className="text-blue-300">Пользователей пока нет</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((u) => {
                  const userResults = results.filter(r => r.userId === u.id);
                  const avgScore = userResults.length > 0
                    ? Math.round(
                        userResults.reduce(
                          (sum, r) => sum + (r.correctAnswers / r.totalQuestions) * 100, 0
                        ) / userResults.length
                      )
                    : 0;

                  return (
                    <div
                      key={u.id}
                      className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10"
                    >
                      <h3 className="text-lg font-semibold text-white">{u.fullName}</h3>
                      <p className="text-blue-300 text-sm">{getSpecialtyName(u.specialty)}</p>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-400">Логин:</span>
                          <span className="text-white">{u.login}</span>
                        </div>
                        {/* Вместо возраста показываем дату рождения */}
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-400">Дата рождения:</span>
                          <span className="text-white">{formatDate(u.dateOfBirth)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-400">Образование:</span>
                          <span className="text-white text-right">
                            {u.education
                              ? EDUCATION_LEVELS.find((e) => e.id === u.education)?.name || u.education
                              : 'Не указано'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-400">Пройдено тестов:</span>
                          <span className="text-white">{userResults.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-400">Средний результат:</span>
                          <span className={`font-semibold ${
                            avgScore >= 70 ? 'text-green-400' : 'text-orange-400'
                          }`}>
                            {avgScore}%
                          </span>
                        </div>
                      </div>

                      {userResults.length > 0 && (
                        <div className="mt-4 border-t border-white/10 pt-4">
                          <p className="text-blue-300 text-xs mb-2">Разрешить пересдачу:</p>
                          <div className="space-y-1">
                            {userResults.map((r) => (
                              <div key={r.id} className="flex items-center justify-between">
                                <span className="text-white text-xs truncate max-w-[150px]">
                                  {r.testTitle}
                                </span>
                                <button
                                  onClick={() => handleResetResult(u.id, r.testId, u.fullName)}
                                  className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded text-xs transition-colors"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Пересдача
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ===== МОДАЛЬНОЕ ОКНО ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="sticky top-0 bg-slate-800 border-b border-white/10 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingTest ? 'Редактирование теста' : 'Создание нового теста'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-blue-300" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-2">
                    Название теста
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: Диагностика двигателя"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-2">
                    Специальность
                  </label>
                  <select
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" className="bg-slate-800">Выберите специальность</option>
                    {SPECIALTIES.map((spec) => (
                      <option key={spec.id} value={spec.id} className="bg-slate-800">
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-300 mb-2">Описание</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                  placeholder="Краткое описание теста"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-300 mb-2">
                  Время на прохождение (минут)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={form.timeLimit}
                  onChange={(e) => setForm({ ...form, timeLimit: parseInt(e.target.value) || 30 })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Вопросы ({form.questions.length+1})
                </h3>

                {form.questions.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {form.questions.map((q, index) => (
                      <div key={q.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <p className="text-white font-medium">{index + 1}. {q.text}</p>
                          <button
                            onClick={() => handleRemoveQuestion(index)}
                            className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors ml-2 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-2 space-y-1">
                          {q.options.map((option, optIndex) => (
                            <p
                              key={optIndex}
                              className={`text-sm ${
                                optIndex === q.correctAnswer ? 'text-green-400' : 'text-blue-300'
                              }`}
                            >
                              {optIndex === q.correctAnswer && '✓ '}{option}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-md font-semibold text-white mb-4">Добавить вопрос</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-300 mb-2">
                        Текст вопроса
                      </label>
                      <input
                        type="text"
                        value={newQuestion.text}
                        onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Введите вопрос"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {newQuestion.options.map((option, index) => (
                        <div key={index}>
                          <label className="block text-sm font-medium text-blue-300 mb-1">
                            Вариант {index + 1}
                            {newQuestion.correctAnswer === index && (
                              <span className="ml-2 text-green-400">(правильный)</span>
                            )}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...newQuestion.options];
                                newOptions[index] = e.target.value;
                                setNewQuestion({ ...newQuestion, options: newOptions });
                              }}
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`Вариант ${index + 1}`}
                            />
                            <button
                              onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: index })}
                              className={`px-3 py-2 rounded-lg transition-colors ${
                                newQuestion.correctAnswer === index
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white/10 text-blue-300 hover:bg-white/20'
                              }`}
                              title="Отметить как правильный"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleAddQuestion}
                      className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Добавить вопрос
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-800 border-t border-white/10 p-6 flex justify-end gap-4">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveTest}
                disabled={form.questions.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingTest ? 'Сохранить изменения' : 'Создать тест'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;