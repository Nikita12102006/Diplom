import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SPECIALTIES } from '../types';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, updateProfile } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    login: '',
    specialty: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user) {
      setForm(f => ({
        ...f,
        fullName: user.fullName,
        login: user.login,
        specialty: user.specialty,
      }));
    }
  }, [isAuthenticated, user, navigate]);

  if (!user) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.fullName.trim() || !form.login.trim() || !form.specialty) {
      setError('Заполните ФИО, логин и специальность');
      return;
    }

    if (form.newPassword) {
      if (form.newPassword !== form.confirmNewPassword) {
        setError('Новые пароли не совпадают');
        return;
      }
    }

    const res = updateProfile({
      fullName: form.fullName,
      login: form.login,
      specialty: form.specialty,
      currentPassword: form.newPassword ? form.currentPassword : undefined,
      newPassword: form.newPassword ? form.newPassword : undefined,
    });

    if (!res.ok) {
      setError(res.error || 'Не удалось сохранить');
      return;
    }

    setSuccess('Профиль сохранён');
    setForm(f => ({
      ...f,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-white text-2xl font-bold">Профиль</h1>
          <Link
            to={isAdmin ? '/admin' : '/dashboard'}
            className="text-blue-300 hover:text-blue-200"
          >
            Назад
          </Link>
        </header>

        {(error || success) && (
          <div
            className={`mb-4 p-4 rounded-lg border ${
              error
                ? 'bg-red-500/20 border-red-500/30'
                : 'bg-green-500/20 border-green-500/30'
            }`}
          >
            <p className={`text-sm ${error ? 'text-red-200' : 'text-green-200'}`}>
              {error || success}
            </p>
          </div>
        )}

        <form
          onSubmit={submit}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 space-y-4"
        >
          <div>
            <label className="block text-sm text-blue-200 mb-2">Полное имя</label>
            <input
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Иванов Иван Иванович"
            />
          </div>

          <div>
            <label className="block text-sm text-blue-200 mb-2">Логин</label>
            <input
              value={form.login}
              onChange={e => setForm({ ...form, login: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Логин"
            />
          </div>

          <div>
            <label className="block text-sm text-blue-200 mb-2">Специальность</label>
            <select
              value={form.specialty}
              onChange={e => setForm({ ...form, specialty: e.target.value })}
              disabled={user.role === 'admin'}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="" className="bg-slate-800">
                Выберите специальность
              </option>
              {SPECIALTIES.map(spec => (
                <option key={spec.id} value={spec.id} className="bg-slate-800">
                  {spec.name}
                </option>
              ))}
            </select>
            {user.role === 'admin' && (
              <p className="text-xs text-blue-300/70 mt-2">
                У администратора специальность не редактируется.
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-white font-semibold mb-3">Смена пароля (необязательно)</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-blue-200 mb-2">Текущий пароль</label>
                <input
                  type="password"
                  value={form.currentPassword}
                  onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Введите текущий пароль"
                />
              </div>

              <div>
                <label className="block text-sm text-blue-200 mb-2">Новый пароль</label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={e => setForm({ ...form, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Минимум 6 символов"
                />
              </div>

              <div>
                <label className="block text-sm text-blue-200 mb-2">Повторите новый пароль</label>
                <input
                  type="password"
                  value={form.confirmNewPassword}
                  onChange={e => setForm({ ...form, confirmNewPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Повторите новый пароль"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
          >
            Сохранить
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;