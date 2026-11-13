import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:4000';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

interface PublicUser {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
}

type TaskStatus = 'todo' | 'in_progress' | 'done';

type TaskPriority = 'low' | 'medium' | 'high';

interface TaskRecord {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Database {
  users: User[];
  projects: Project[];
  tasks: TaskRecord[];
}

interface RegisterRequest {
  name?: string;
  email?: string;
  password?: string;
}

interface LoginRequest {
  email?: string;
  password?: string;
}

interface CreateProjectRequest {
  name?: string;
  description?: string;
}

interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

interface CreateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  due_date?: string | null;
}

type UpdateTaskRequest = Partial<
  Pick<
    TaskRecord,
    | 'title'
    | 'description'
    | 'status'
    | 'priority'
    | 'assignee_id'
    | 'due_date'
  >
>;

interface TokenPayload {
  userId: string;
  exp: number;
}

type ValidationFields = Record<string, string>;

// ─────────────────────────────────────────────────────────────────────────────
// In-memory Database
// ─────────────────────────────────────────────────────────────────────────────
//
// This data is provided to simulate a backend database.
// Students should NOT modify the initial data unless necessary for testing.

const db: Database = {
  users: [
    {
      id: 'seed-001',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    },
  ],

  projects: [
    {
      id: 'proj-001',
      name: 'TaskFlow App',
      description: 'Main product dashboard and task system',
      owner_id: 'seed-001',
      created_at: '2026-04-01T10:00:00Z',
    },
    {
      id: 'proj-002',
      name: 'Marketing Site',
      description: 'Landing page redesign and SEO updates',
      owner_id: 'seed-001',
      created_at: '2026-04-02T10:00:00Z',
    },
  ],

  tasks: [
    {
      id: 'task-001',
      project_id: 'proj-001',
      title: 'Set up project structure',
      description: 'Follow Vite + React template',
      status: 'done',
      priority: 'high',
      assignee_id: 'seed-001',
      due_date: '2026-04-10',
      created_at: '2026-04-01T10:00:00Z',
      updated_at: '2026-04-10T10:00:00Z',
    },
    {
      id: 'task-002',
      project_id: 'proj-001',
      title: 'Design auth pages',
      description: 'Use AuthPage.css for styling',
      status: 'done',
      priority: 'high',
      assignee_id: 'seed-001',
      due_date: '2026-04-11',
      created_at: '2026-04-01T11:00:00Z',
      updated_at: '2026-04-11T10:00:00Z',
    },
    {
      id: 'task-003',
      project_id: 'proj-001',
      title: 'Build dashboard UI',
      description: 'Cards with color tops and progress bars',
      status: 'in_progress',
      priority: 'medium',
      assignee_id: 'seed-001',
      due_date: '2026-04-14',
      created_at: '2026-04-02T10:00:00Z',
      updated_at: '2026-04-02T10:00:00Z',
    },
    {
      id: 'task-004',
      project_id: 'proj-001',
      title: 'Connect mock API',
      description: 'Wire up MSW handlers',
      status: 'in_progress',
      priority: 'low',
      assignee_id: null,
      due_date: '2026-04-15',
      created_at: '2026-04-02T11:00:00Z',
      updated_at: '2026-04-02T11:00:00Z',
    },
    {
      id: 'task-005',
      project_id: 'proj-001',
      title: 'Write unit tests',
      description: '',
      status: 'todo',
      priority: 'low',
      assignee_id: null,
      due_date: '2026-04-20',
      created_at: '2026-04-03T10:00:00Z',
      updated_at: '2026-04-03T10:00:00Z',
    },
    {
      id: 'task-006',
      project_id: 'proj-002',
      title: 'Redesign landing page',
      description: 'New hero section',
      status: 'in_progress',
      priority: 'high',
      assignee_id: 'seed-001',
      due_date: '2026-04-18',
      created_at: '2026-04-02T10:00:00Z',
      updated_at: '2026-04-02T10:00:00Z',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

const createId = (): string =>
  `id-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const getCurrentDate = (): string => new Date().toISOString();

const makeToken = (userId: string): string =>
  btoa(
    JSON.stringify({
      userId,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }),
  );

const getPublicUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

const getUser = (request: Request): User | null => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = JSON.parse(atob(token)) as Partial<TokenPayload>;

    if (!payload.userId || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return db.users.find((user) => user.id === payload.userId) ?? null;
  } catch {
    return null;
  }
};

const unauthorized = () =>
  HttpResponse.json({ error: 'unauthorized' }, { status: 401 });

const notFound = () =>
  HttpResponse.json({ error: 'not found' }, { status: 404 });

const forbidden = () =>
  HttpResponse.json({ error: 'forbidden' }, { status: 403 });

const validationError = (fields: ValidationFields) =>
  HttpResponse.json({ error: 'validation failed', fields }, { status: 400 });

const getParam = (
  param: string | readonly string[] | undefined,
): string => {
  if (typeof param === 'string') return param;
  if (Array.isArray(param)) return param[0] ?? '';
  return '';
};

// ─────────────────────────────────────────────────────────────────────────────
// API Handlers
// ─────────────────────────────────────────────────────────────────────────────

export const handlers = [
  // ───────────────────────────────────────────────────────────────────────────
  // AUTHENTICATION
  // ───────────────────────────────────────────────────────────────────────────

  // POST /auth/register
  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as RegisterRequest;

    const name = body.name?.trim();
    const email = body.email?.trim();
    const password = body.password;

    const fields: ValidationFields = {};
    if (!name) fields.name = 'is required';
    if (!email) fields.email = 'is required';
    if (!password) fields.password = 'is required';
    if (Object.keys(fields).length > 0) return validationError(fields);

    const emailTaken = db.users.some(
      (user) => user.email.toLowerCase() === email!.toLowerCase(),
    );
    if (emailTaken) return validationError({ email: 'already taken' });

    const user: User = {
      id: createId(),
      name: name!,
      email: email!,
      password: password!,
    };

    db.users.push(user);

    const token = makeToken(user.id);

    return HttpResponse.json(
      { token, user: getPublicUser(user) },
      { status: 201 },
    );
  }),

  // POST /auth/login
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest;

    const user = db.users.find(
      (item) =>
        item.email.toLowerCase() === body.email?.toLowerCase() &&
        item.password === body.password,
    );

    if (!user) return unauthorized();

    const token = makeToken(user.id);

    return HttpResponse.json({ token, user: getPublicUser(user) });
  }),

  // GET /auth/me
  http.get(`${BASE_URL}/auth/me`, ({ request }) => {
    const user = getUser(request);
    if (!user) return unauthorized();

    return HttpResponse.json(getPublicUser(user));
  }),

  // ───────────────────────────────────────────────────────────────────────────
  // PROJECTS
  // ───────────────────────────────────────────────────────────────────────────

  // GET /projects
  http.get(`${BASE_URL}/projects`, ({ request }) => {
    const user = getUser(request);
    if (!user) return unauthorized();

    const projects = db.projects
      .filter((project) => project.owner_id === user.id)
      .map((project) => {
        const tasks = db.tasks.filter(
          (task) => task.project_id === project.id,
        );

        return {
          ...project,
          task_count: tasks.length,
          done_count: tasks.filter((task) => task.status === 'done').length,
        };
      });

    return HttpResponse.json({ projects });
  }),

  // POST /projects
  http.post(`${BASE_URL}/projects`, async ({ request }) => {
    const user = getUser(request);
    if (!user) return unauthorized();

    const body = (await request.json()) as CreateProjectRequest;
    const name = body.name?.trim();

    if (!name) {
      return validationError({ name: 'is required' });
    }

    const project: Project = {
      id: createId(),
      name,
      description: body.description?.trim() ?? '',
      owner_id: user.id,
      created_at: getCurrentDate(),
    };

    db.projects.push(project);

    return HttpResponse.json(project, { status: 201 });
  }),

  // GET /projects/:id
  http.get(`${BASE_URL}/projects/:id`, ({ request, params }) => {
    const user = getUser(request);
    if (!user) return unauthorized();

    const id = getParam(params.id);
    const project = db.projects.find((item) => item.id === id);
    if (!project) return notFound();
    if (project.owner_id !== user.id) return forbidden();

    const tasks = db.tasks.filter((task) => task.project_id === project.id);

    return HttpResponse.json({ ...project, tasks });
  }),

  // PATCH /projects/:id
  http.patch(`${BASE_URL}/projects/:id`, async ({ request, params }) => {
    const user = getUser(request);
    if (!user) return unauthorized();

    const id = getParam(params.id);
    const project = db.projects.find((item) => item.id === id);
    if (!project) return notFound();
    if (project.owner_id !== user.id) return forbidden();

    const body = (await request.json()) as UpdateProjectRequest;

    if (body.name !== undefined) {
      const trimmedName = body.name.trim();
      if (!trimmedName) return validationError({ name: 'is required' });
      project.name = trimmedName;
    }

    if (body.description !== undefined) {
      project.description = body.description.trim();
    }

    return HttpResponse.json(project);
  }),

  // DELETE /projects/:id
  http.delete(`${BASE_URL}/projects/:id`, ({ request, params }) => {
    const user = getUser(request);
    if (!user) return unauthorized();

    const id = getParam(params.id);
    const project = db.projects.find((item) => item.id === id);
    if (!project) return notFound();
    if (project.owner_id !== user.id) return forbidden();

    db.projects = db.projects.filter((item) => item.id !== id);
    db.tasks = db.tasks.filter((task) => task.project_id !== id);

    return new HttpResponse(null, { status: 204 });
  }),

  // ───────────────────────────────────────────────────────────────────────────
  // TASKS
  // ───────────────────────────────────────────────────────────────────────────

  // GET /projects/:id/tasks
  http.get(`${BASE_URL}/projects/:id/tasks`, ({ request, params }) => {
    const user = getUser(request);
    if (!user) return unauthorized();

    const projectId = getParam(params.id);
    const project = db.projects.find((item) => item.id === projectId);
    if (!project) return notFound();
    if (project.owner_id !== user.id) return forbidden();

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const assignee = url.searchParams.get('assignee');
    const search = url.searchParams.get('search')?.toLowerCase();

    let tasks = db.tasks.filter((task) => task.project_id === projectId);

    if (status) tasks = tasks.filter((task) => task.status === status);
    if (priority) tasks = tasks.filter((task) => task.priority === priority);
    if (assignee) {
      tasks = tasks.filter((task) => task.assignee_id === assignee);
    }
    if (search) {
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(search) ||
          task.description.toLowerCase().includes(search),
      );
    }

    return HttpResponse.json({ tasks });
  }),

  // POST /projects/:id/tasks
  http.post(
    `${BASE_URL}/projects/:id/tasks`,
    async ({ request, params }) => {
      const user = getUser(request);
      if (!user) return unauthorized();

      const projectId = getParam(params.id);
      const project = db.projects.find((item) => item.id === projectId);
      if (!project) return notFound();
      if (project.owner_id !== user.id) return forbidden();

      const body = (await request.json()) as CreateTaskRequest;
      const title = body.title?.trim();
      if (!title) return validationError({ title: 'is required' });

      const now = getCurrentDate();

      const task: TaskRecord = {
        id: createId(),
        project_id: projectId,
        title,
        description: body.description?.trim() ?? '',
        status: body.status ?? 'todo',
        priority: body.priority ?? 'medium',
        assignee_id: body.assignee_id ?? null,
        due_date: body.due_date ?? null,
        created_at: now,
        updated_at: now,
      };

      db.tasks.push(task);

      return HttpResponse.json(task, { status: 201 });
    },
  ),

  // PATCH /tasks/:id
  http.patch(`${BASE_URL}/tasks/:id`, async ({ request, params }) => {
    const user = getUser(request);
    if (!user) return unauthorized();

    const id = getParam(params.id);
    const task = db.tasks.find((item) => item.id === id);
    if (!task) return notFound();

    const project = db.projects.find((item) => item.id === task.project_id);
    if (!project || project.owner_id !== user.id) return forbidden();

    const body = (await request.json()) as UpdateTaskRequest;

    if (body.title !== undefined) {
      const trimmedTitle = body.title.trim();
      if (!trimmedTitle) return validationError({ title: 'cannot be empty' });
      task.title = trimmedTitle;
    }
    if (body.description !== undefined) {
      task.description = body.description.trim();
    }
    if (body.status !== undefined) task.status = body.status;
    if (body.priority !== undefined) task.priority = body.priority;
    if (body.assignee_id !== undefined) task.assignee_id = body.assignee_id;
    if (body.due_date !== undefined) task.due_date = body.due_date;

    task.updated_at = getCurrentDate();

    return HttpResponse.json(task);
  }),

  // DELETE /tasks/:id
  http.delete(`${BASE_URL}/tasks/:id`, ({ request, params }) => {
    const user = getUser(request);
    if (!user) return unauthorized();

    const id = getParam(params.id);
    const task = db.tasks.find((item) => item.id === id);
    if (!task) return notFound();

    const project = db.projects.find((item) => item.id === task.project_id);
    if (!project || project.owner_id !== user.id) return forbidden();

    db.tasks = db.tasks.filter((item) => item.id !== id);

    return new HttpResponse(null, { status: 204 });
  }),
];