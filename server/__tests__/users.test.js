const request = require('supertest');
const { app } = require('../app.cjs');

describe('Users API', () => {
  let testUserId;
  const uniqueLogin = `testuser_${Date.now()}`;

  beforeAll(async () => {
    // Создаём тестового пользователя
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        login: uniqueLogin,
        password: 'testpass',
        fullName: 'Test User',
        specialty: 'mechanic',
        age: 25,
        education: 'Среднее',
      });
    testUserId = res.body.id;
  });

  test('GET /api/users – возвращает список всех пользователей', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(u => u.id === testUserId)).toBe(true);
  });

  test('GET /api/users/:id – возвращает конкретного пользователя', async () => {
    const res = await request(app).get(`/api/users/${testUserId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testUserId);
    expect(res.body.login).toBe(uniqueLogin);
  });

  test('PATCH /api/users/:id – обновляет возраст и образование', async () => {
    const res = await request(app)
      .patch(`/api/users/${testUserId}`)
      .send({
        age: 30,
        education: 'Высшее техническое',
      });
    expect(res.status).toBe(200);
    expect(res.body.age).toBe(30);
    expect(res.body.education).toBe('Высшее техническое');
  });

  test('PATCH /api/users/:id – обновляет ФИО и логин', async () => {
    const newLogin = `updated_${uniqueLogin}`;
    const res = await request(app)
      .patch(`/api/users/${testUserId}`)
      .send({
        fullName: 'Updated Name',
        login: newLogin,
      });
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Updated Name');
    expect(res.body.login).toBe(newLogin);
  });
});