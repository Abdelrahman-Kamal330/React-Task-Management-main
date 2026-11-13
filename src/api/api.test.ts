import { fetchProjects, createProject, fetchTasks, loginUser } from './api';

describe('api.ts', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  test('loginUser sends a POST request and saves the session', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        token: 'fake-token',
        user: { id: 'u1', name: 'Test User', email: 'test@example.com' },
      }),
    });

    const result = await loginUser({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.token).toBe('fake-token');
    expect(localStorage.getItem('tf_token')).toBe('fake-token');
  });

  test('fetchProjects sends the Authorization header when a token exists', async () => {
    localStorage.setItem('tf_token', 'fake-token');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        projects: [{ id: 'p1', name: 'Test Project' }],
      }),
    });

    const projects = await fetchProjects();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('Test Project');

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer fake-token');
  });

  test('fetchProjects throws a clear error when there is no token', async () => {
    await expect(fetchProjects()).rejects.toThrow('Failed to fetch projects');
  });

  test('createProject sends the project data as JSON in the request body', async () => {
    localStorage.setItem('tf_token', 'fake-token');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 'p1', name: 'New Project' }),
    });

    await createProject({ name: 'New Project' });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ name: 'New Project' });
  });

  test('fetchTasks adds the given filters as query params', async () => {
    localStorage.setItem('tf_token', 'fake-token');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ tasks: [] }),
    });

    await fetchTasks('proj-001', { status: 'todo', search: 'test' });

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(
      'http://localhost:4000/projects/proj-001/tasks?status=todo&search=test',
    );
  });
});
