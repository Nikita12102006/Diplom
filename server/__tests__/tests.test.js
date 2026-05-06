const request = require('supertest');
const { app } = require('../app.cjs');

describe('Tests API', () => {
  let createdTestId;
  const uniqueTestId = `test-${Date.now()}`;

  const sampleTest = {
    id: uniqueTestId,
    title: 'Тестовый тест',
    description: 'Описание для теста',
    specialty: 'mechanic',
    timeLimit: 30,
    questions: [
      {
        id: 'q1',
        text: 'Вопрос 1',
        options: ['A', 'B', 'C'],
        correctAnswer: 0,
      },
    ],
  };

  test('POST /api/tests – создаёт новый тест', async () => {
    const res = await request(app).post('/api/tests').send(sampleTest);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(uniqueTestId);
    expect(res.body.title).toBe('Тестовый тест');
    createdTestId = res.body.id;
  });

  test('GET /api/tests – возвращает массив тестов (содержит созданный)', async () => {
    const res = await request(app).get('/api/tests');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(t => t.id === createdTestId)).toBe(true);
  });

  test('PUT /api/tests/:id – обновляет тест', async () => {
    const updated = { ...sampleTest, title: 'Обновлённый тест' };
    const res = await request(app).put(`/api/tests/${createdTestId}`).send(updated);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Обновлённый тест');
  });

  test('DELETE /api/tests/:id – удаляет тест', async () => {
    const res = await request(app).delete(`/api/tests/${createdTestId}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Проверяем, что тест действительно удалён
    const getRes = await request(app).get('/api/tests');
    expect(getRes.body.some(t => t.id === createdTestId)).toBe(false);
  });
});