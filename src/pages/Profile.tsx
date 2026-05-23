import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SPECIALTIES, EDUCATION_LEVELS } from '../types';
import { User, Briefcase, Save, ArrowLeft, LogOut, GraduationCap, Calendar } from 'lucide-react';
import { updateUserProfile } from '../services/storage';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    specialty: user?.specialty || '',
    login: user?.login || '',
    dateOfBirth: user?.dateOfBirth || '',
    education: user?.education || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const getSpecialtyName = (id: string) => SPECIALTIES.find(s => s.id === id)?.name || id;
  const getEducationName = (id: string) => EDUCATION_LEVELS.find(e => e.id === id)?.name || id;

  // Форматирование даты для отображения
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Не указана';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Валидация даты рождения (необязательная, но полезная)
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 16) {
        setError('Возраст должен быть не менее 16 лет');
        return;
      }
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);
    try {
      const updatedUser = await updateUserProfile(user.id, {
        fullName: formData.fullName,
        specialty: formData.specialty,
        login: formData.login,
        dateOfBirth: formData.dateOfBirth || undefined,
        education: formData.education,
        ...(formData.newPassword
          ? { currentPassword: formData.currentPassword, newPassword: formData.newPassword }
          : {}),
      });
      setUser(updatedUser);
      setMessage('Профиль успешно обновлён');
      setIsEditing(false);
      setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления профиля');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-blue-300" />
            </button>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">Редактирование профиля</h1>
              <p className="text-blue-300 text-sm">{user.fullName}</p>
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

      <main className="max-w-2xl mx-auto px-4 py-8">
        {message && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-200 text-sm text-center">{message}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur rounded-xl p-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Личная информация</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Редактировать
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Полное имя */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Полное имя
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Специальность */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Специальность
                </label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
                >
                  {SPECIALTIES.map((spec) => (
                    <option key={spec.id} value={spec.id} className="bg-slate-800">
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Образование */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  <GraduationCap className="w-4 h-4 inline mr-2" />
                  Образование
                </label>
                <select
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-800">Выберите уровень образования</option>
                  {EDUCATION_LEVELS.map((edu) => (
                    <option key={edu.id} value={edu.id} className="bg-slate-800">
                      {edu.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Дата рождения */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Дата рождения
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Логин */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Логин</label>
                <input
                  type="text"
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Смена пароля */}
              <div className="border-t border-white/10 pt-5">
                <h3 className="text-white font-medium mb-4">Изменить пароль (необязательно)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">Текущий пароль</label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Введите текущий пароль"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">Новый пароль</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Минимум 6 символов"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">Подтвердите новый пароль</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Повторите новый пароль"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    setFormData({
                      fullName: user.fullName,
                      specialty: user.specialty,
                      login: user.login,
                      dateOfBirth: user.dateOfBirth || '',
                      education: user.education || '',
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-blue-300 text-sm mb-1">Полное имя</p>
                <p className="text-white text-lg">{user.fullName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-blue-300 text-sm mb-1">Дата рождения</p>
                  <p className="text-white text-lg">{formatDate(user.dateOfBirth)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-blue-300 text-sm mb-1">Специальность</p>
                  <p className="text-white text-lg">{getSpecialtyName(user.specialty)}</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-blue-300 text-sm mb-1">Образование</p>
                <p className="text-white text-lg">{user.education ? getEducationName(user.education) : 'Не указано'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-blue-300 text-sm mb-1">Логин</p>
                <p className="text-white text-lg">{user.login}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-blue-300 text-sm mb-1">Роль</p>
                <p className="text-white text-lg">{user.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;