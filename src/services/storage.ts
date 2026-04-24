import { User, Test, TestResult } from '../types';

const CURRENT_USER_ID_KEY = 'autoservice_current_user_id';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

// ===== session (only userId) =====
export const setCurrentUserId = (id: string | null) => {
  if (id) localStorage.setItem(CURRENT_USER_ID_KEY, id);
  else localStorage.removeItem(CURRENT_USER_ID_KEY);
};

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem(CURRENT_USER_ID_KEY);
};

// ===== auth =====
export const apiLogin = (login: string, password: string) => {
  return api<User>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
};

export const apiRegister = (data: { login: string; password: string; fullName: string; specialty: string }) => {
  return api<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// ===== users =====
export const getUsers = () => api<User[]>('/api/users');
export const getUserById = (id: string) => api<User>(`/api/users/${id}`);

export const updateUserProfile = (id: string, data: {
  login?: string;
  fullName?: string;
  specialty?: string;
  currentPassword?: string;
  newPassword?: string;
}) => {
  return api<User>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

// ===== tests =====
export const getTests = () => api<Test[]>('/api/tests');

export const saveTest = (test: Test) => api<Test>('/api/tests', {
  method: 'POST',
  body: JSON.stringify(test),
});

export const updateTest = (test: Test) => api<Test>(`/api/tests/${test.id}`, {
  method: 'PUT',
  body: JSON.stringify(test),
});

export const deleteTest = (testId: string) => api<{ ok: true }>(`/api/tests/${testId}`, {
  method: 'DELETE',
});

export const getTestsBySpecialty = async (specialty: string) => {
  const tests = await getTests();
  return tests.filter(t => t.specialty === specialty);
};

// ===== results =====
export const getResults = () => api<TestResult[]>('/api/results');

export const saveResult = (result: TestResult) => api<TestResult>('/api/results', {
  method: 'POST',
  body: JSON.stringify(result),
});

export const getResultsByUser = (userId: string) => api<TestResult[]>(`/api/results/user/${userId}`);
export const getResultsByTest = (testId: string) => api<TestResult[]>(`/api/results/test/${testId}`);