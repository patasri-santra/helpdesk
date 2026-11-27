process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

describe('API guards (no DB needed)', () => {
  test('health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  test('protected route without token -> 401', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(401);
  });

  test('garbage token -> 401', async () => {
    const res = await request(app).get('/api/tickets').set('Authorization', 'Bearer nope');
    expect(res.status).toBe(401);
  });

  test('register validates input', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'bad', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  test('register rejects a self-assigned role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Eve', email: 'eve@test.com', password: 'Passw0rdd', role: 'ADMIN' });
    expect(res.status).toBe(400);
  });

  test('unknown route -> 404 JSON', async () => {
    const res = await request(app).get('/nothing');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

const dbDescribe = process.env.MONGO_URI_TEST ? describe : describe.skip;

dbDescribe('Ticket workflow (needs MONGO_URI_TEST)', () => {
  const User = require('../src/models/User');
  const ActivityLog = require('../src/models/ActivityLog');
  const Notification = require('../src/models/Notification');
  let userToken, otherToken, adminToken, ticketId;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
    await mongoose.connection.dropDatabase();
    await User.create({ name: 'Admin', email: 'admin@test.com', password: 'Admin@1234', role: 'ADMIN' });
    const login = async (email) => (await request(app).post('/api/auth/login').send({ email, password: 'Passw0rdd' })).body.token;
    await request(app).post('/api/auth/register').send({ name: 'Ann', email: 'ann@test.com', password: 'Passw0rdd' });
    await request(app).post('/api/auth/register').send({ name: 'Bob', email: 'bob@test.com', password: 'Passw0rdd' });
    userToken = await login('ann@test.com');
    otherToken = await login('bob@test.com');
    adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@1234' })).body.token;
  });
  afterAll(async () => { await mongoose.disconnect(); });

  test('user creates a ticket and admin is notified via events', async () => {
    const res = await request(app).post('/api/tickets').set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Cannot log in', description: 'I get an error every time I try.', priority: 'HIGH' });
    expect(res.status).toBe(201);
    ticketId = res.body.data._id;
    await wait(300);
    expect(await ActivityLog.countDocuments({ ticket: ticketId, event: 'ticket.created' })).toBe(1);
    expect(await Notification.countDocuments({ event: 'ticket.created' })).toBe(1);
  });

  test("another user cannot see someone else's ticket", async () => {
    const res = await request(app).get(`/api/tickets/${ticketId}`).set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });

  test('user cannot change status; admin can', async () => {
    const bad = await request(app).patch(`/api/tickets/${ticketId}`).set('Authorization', `Bearer ${userToken}`).send({ status: 'RESOLVED' });
    expect(bad.status).toBe(403);
    const ok = await request(app).patch(`/api/tickets/${ticketId}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'RESOLVED' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.resolvedAt).toBeTruthy();
    await wait(300);
    expect(await ActivityLog.countDocuments({ ticket: ticketId, event: 'ticket.resolved' })).toBe(1);
  });

  test('user cannot reach admin routes', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('comments work for owner and admin', async () => {
    const c1 = await request(app).post(`/api/tickets/${ticketId}/comments`).set('Authorization', `Bearer ${userToken}`).send({ body: 'Thanks!' });
    const c2 = await request(app).post(`/api/tickets/${ticketId}/comments`).set('Authorization', `Bearer ${adminToken}`).send({ body: 'Fixed.' });
    expect([c1.status, c2.status]).toEqual([201, 201]);
    const list = await request(app).get(`/api/tickets/${ticketId}/comments`).set('Authorization', `Bearer ${userToken}`);
    expect(list.body.data).toHaveLength(2);
  });
});
