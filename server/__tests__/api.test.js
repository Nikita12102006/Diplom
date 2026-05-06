const request = require('supertest');
const { app } = require('../app.cjs');

describe('API тесты', () => {
  test('GET /api/tests возвращает массив тестов', async () => {
    const response = await request(app).get('/api/tests');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});