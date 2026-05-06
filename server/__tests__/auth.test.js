const request = require('supertest');
const { app } = require('../app.cjs');

describe('Регистрация и аутентификация', () => {
  test('POST /api/auth/register создаёт нового пользователя', async () => {
    const newUser = {
      login: `test_${Date.now()}`,
      password: '123456',
      fullName: 'Тестовый Пользователь',
      specialty: 'mechanic',
      age: 30,
      education: 'Высшее',
    };
    const res = await request(app).post('/api/auth/register').send(newUser);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.age).toBe(30);
    expect(res.body.education).toBe('Высшее');
  });

  test('POST /api/auth/login с правильными данными возвращает пользователя', async () => {
    const res = await request(app).post('/api/auth/login').send({
      login: 'admin',
      password: 'admin123',
    });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });
});