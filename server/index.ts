

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readJSON = <T>(filename: string): T[] => {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]');
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) && parsed[filename]) {
      return parsed[filename];
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Ошибка чтения ${filename}.json:`, error);
    return [];
  }
};

const writeJSON = (filename: string, data: any[]): boolean => {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Ошибка записи ${filename}.json:`, error);
    return false;
  }
};

const initAdmin = () => {
  const users = readJSON<any>('users');
  const adminExists = users.some((u: any) => u.role === 'admin');
  if (!adminExists) {
    users.push({
      id: 'admin-1',
      login: 'admin',
      password: 'admin123',
      fullName: 'Администратор',
      specialty: 'admin',
      role: 'admin'
    });
    writeJSON('users', users);
    console.log('✅ Админ создан: admin / admin123');
  }
};

initAdmin();

// ============ AUTH ============

app.post('/api/auth/login', (req, res) => {
  try {
    const { login, password } = req.body;
    const users = readJSON<any>('users');
    const user = users.find((u: any) => u.login === login && u.password === password);
    if (user) {
      res.json(user);
    } else {
      res.status(400).json({ error: 'Неверный логин или пароль' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { login, password, fullName, specialty } = req.body;
    const users = readJSON<any>('users');
    const existingUser = users.find((u: any) => u.login === login);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }
    const newUser = {
      id: `user-${Date.now()}`,
      login,
      password,
      fullName,
      specialty,
      role: 'user'
    };
    users.push(newUser);
    writeJSON('users', users);
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============ ПОЛЬЗОВАТЕЛИ ============

app.get('/api/users', (req, res) => {
  try {
    const users = readJSON<any>('users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const users = readJSON<any>('users');
    const user = users.find((u: any) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.patch('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, specialty, login, currentPassword, newPassword } = req.body;
    const users = readJSON<any>('users');
    const index = users.findIndex((u: any) => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    if (newPassword) {
      if (users[index].password !== currentPassword) {
        return res.status(400).json({ error: 'Неверный текущий пароль' });
      }
      users[index].password = newPassword;
    }
    if (fullName) users[index].fullName = fullName;
    if (specialty) users[index].specialty = specialty;
    if (login) users[index].login = login;
    writeJSON('users', users);
    res.json(users[index]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============ ТЕСТЫ ============

app.get('/api/tests', (req, res) => {
  try {
    const tests = readJSON<any>('tests');
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/tests', (req, res) => {
  try {
    const tests = readJSON<any>('tests');
    const newTest = {
      ...req.body,
      createdAt: new Date().toISOString()
    };
    tests.push(newTest);
    writeJSON('tests', tests);
    res.json(newTest);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить тест (PUT)
app.put('/api/tests/:id', (req, res) => {
  try {
    const tests = readJSON<any>('tests');
    const index = tests.findIndex((t: any) => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Тест не найден' });
    tests[index] = {
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };
    writeJSON('tests', tests);
    res.json(tests[index]);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/tests/:id', (req, res) => {
  try {
    const tests = readJSON<any>('tests');
    const filtered = tests.filter((t: any) => t.id !== req.params.id);
    writeJSON('tests', filtered);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============ РЕЗУЛЬТАТЫ ============

app.get('/api/results', (req, res) => {
  try {
    const results = readJSON<any>('results');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/results/user/:userId', (req, res) => {
  try {
    const results = readJSON<any>('results');
    const userResults = results.filter((r: any) => r.userId === req.params.userId);
    res.json(userResults);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/results/test/:testId', (req, res) => {
  try {
    const results = readJSON<any>('results');
    const testResults = results.filter((r: any) => r.testId === req.params.testId);
    res.json(testResults);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/results', (req, res) => {
  try {
    const results = readJSON<any>('results');
    const newResult = {
      ...req.body,
      completedAt: new Date().toISOString()
    };
    results.push(newResult);
    writeJSON('results', results);
    res.json(newResult);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить результат пользователя по тесту (для пересдачи)
app.delete('/api/results/user/:userId/test/:testId', (req, res) => {
  try {
    const results = readJSON<any>('results');
    const filtered = results.filter(
      (r: any) => !(r.userId === req.params.userId && r.testId === req.params.testId)
    );
    writeJSON('results', filtered);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
  console.log(`📁 Данные хранятся в: ${DATA_DIR}`);
});