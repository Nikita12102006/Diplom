const request = require('supertest');
const { app } = require('../app.cjs');

describe('Results API', () => {
  let testUserId;
  let testTestId;
  let resultId;

  const uniqueLogin = `resultuser_${Date.now()}`;
  const uniqueTestId = `resulttest-${Date.now()}`;

  beforeAll(async () => {
    // Создаём пользователя
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        login: uniqueLogin,
        password: 'pass',
        fullName: 'Result User',
        specialty: 'electrician',
      });
    testUserId = userRes.body.id;

    // Создаём тест
    const testRes = await request(app)
      .post('/api/tests')
      .send({
        id: uniqueTestId,
        title: 'Тест для результатов',
        description: 'Тест',
        specialty: 'electrician',
        timeLimit: 20,
        questions: [],
      });
    testTestId = testRes.body.id;
  });

  afterAll(async () => {
    // Очистка: удалить созданные тест и пользователя (опционально, но можно оставить)
    await request(app).delete(`/api/tests/${testTestId}`);
    // Пользователя можно не удалять, чтобы не нарушать целостность
  });

  test('POST /api/results – сохраняет результат теста', async () => {
    const resultData = {
      id: `res-${Date.now()}`,
      userId: testUserId,
      testId: testTestId,
      testTitle: 'Тест для результатов',
      correctAnswers: 8,
      totalQuestions: 10,
    };
    const res = await request(app).post('/api/results').send(resultData);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(resultData.id);
    expect(res.body.correctAnswers).toBe(8);
    resultId = res.body.id;
  });

  test('GET /api/results/user/:userId – возвращает результаты пользователя', async () => {
    const res = await request(app).get(`/api/results/user/${testUserId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(r => r.id === resultId)).toBe(true);
  });

  test('GET /api/results/test/:testId – возвращает результаты по тесту', async () => {
    const res = await request(app).get(`/api/results/test/${testTestId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(r => r.id === resultId)).toBe(true);
  });

  test('DELETE /api/results/user/:userId/test/:testId – удаляет результат', async () => {
    const res = await request(app).delete(`/api/results/user/${testUserId}/test/${testTestId}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Проверяем, что результат удалён
    const checkRes = await request(app).get(`/api/results/user/${testUserId}`);
    expect(checkRes.body.some(r => r.id === resultId)).toBe(false);
  });
});