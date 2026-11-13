import { setupServer } from 'msw/node';
import { handlers } from './handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterAll(() => server.close());

const BASE_URL = 'http://localhost:4000';

const makeToken = (userId: string): string =>
  btoa(JSON.stringify({ userId, exp: Date.now() + 1000 * 60 * 60 }));

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

describe('handlers.ts (mocked Projects/Tasks/Auth API)', () => {
  const token = makeToken('seed-001');

  test('POST /auth/register creates a new user and returns a token', async () => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New User',
        email: 'new-user@example.com',
        password: '123456',
      }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user.email).toBe('new-user@example.com');
    expect(data.token).toBeTruthy();
  });

  test('POST /auth/login works with the seeded test user', async () => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.id).toBe('seed-001');
  });

  test('GET /projects returns only the seed user projects with task counts', async () => {
    const response = await fetch(`${BASE_URL}/projects`, {
      headers: authHeaders(token),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.projects.length).toBeGreaterThan(0);
    expect(data.projects[0]).toHaveProperty('task_count');
  });

  test('GET /projects without a token returns 401', async () => {
    const response = await fetch(`${BASE_URL}/projects`);
    expect(response.status).toBe(401);
  });

  test('POST /projects creates a new project for the current user', async () => {
    const response = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ name: 'New Project' }),
    });
    const project = await response.json();

    expect(response.status).toBe(201);
    expect(project.name).toBe('New Project');
    expect(project.owner_id).toBe('seed-001');
  });

  test('POST /projects without a name returns a validation error', async () => {
    const response = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({}),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.fields.name).toBe('is required');
  });

  test('GET /projects/:id/tasks filters tasks by status', async () => {
    const response = await fetch(
      `${BASE_URL}/projects/proj-001/tasks?status=done`,
      { headers: authHeaders(token) },
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tasks.length).toBeGreaterThan(0);
    expect(
      data.tasks.every((task: { status: string }) => task.status === 'done'),
    ).toBe(true);
  });

  test('PATCH /tasks/:id updates a task', async () => {
    const response = await fetch(`${BASE_URL}/tasks/task-005`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ status: 'done' }),
    });
    const task = await response.json();

    expect(response.status).toBe(200);
    expect(task.status).toBe('done');
  });

  test('DELETE /projects/:id removes the project', async () => {
    const createResponse = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ name: 'Temp Project' }),
    });
    const created = await createResponse.json();

    const deleteResponse = await fetch(`${BASE_URL}/projects/${created.id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });

    expect(deleteResponse.status).toBe(204);
  });
});
