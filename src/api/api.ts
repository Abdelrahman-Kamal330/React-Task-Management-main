// API Client - Student Exercise
//
// API base: http://localhost:4000
//
// The API is intercepted by MSW during development.
//
// Your task:
// Complete the TODOs below using TypeScript and fetch().

const BASE_URL = 'http://localhost:4000';

// ─────────────────────────────────────────────────────────────────────────────
// TODO 1: Create application types
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  task_count?: number;
  done_count?: number;
}

export interface CreateProjectData {
  name: string;
  description?: string;
}

export type UpdateProjectData = Partial<CreateProjectData>;

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
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

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  due_date?: string | null;
}

export type UpdateTaskData = Partial<CreateTaskData>;

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  search?: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// TODO 2: Authentication token
// ─────────────────────────────────────────────────────────────────────────────

const getToken = (): string | null => localStorage.getItem('tf_token');


// ─────────────────────────────────────────────────────────────────────────────
// TODO 3: HTTP request helper
// ─────────────────────────────────────────────────────────────────────────────

// TODO:
// Replace "string" with a proper HttpMethod type.
//
// Only allow:
// GET
// POST
// PATCH
// DELETE

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const request = async <T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  auth = true,
): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'Request failed');
  }

  return data as T;
};


// ─────────────────────────────────────────────────────────────────────────────
// TODO 4: HTTP helpers
// ─────────────────────────────────────────────────────────────────────────────

const get = <T>(path: string, auth = true): Promise<T> =>
  request<T>('GET', path, undefined, auth);

const post = <T>(path: string, body?: unknown, auth = true): Promise<T> =>
  request<T>('POST', path, body, auth);

const patch = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>('PATCH', path, body);

const del = <T>(path: string): Promise<T> => request<T>('DELETE', path);


// ─────────────────────────────────────────────────────────────────────────────
// TODO 5: Authentication
// ─────────────────────────────────────────────────────────────────────────────

const saveSession = (token: string, user: User): void => {
  localStorage.setItem('tf_token', token);
  localStorage.setItem('tf_user', JSON.stringify(user));
};

export const registerUser = async (
  data: RegisterData,
): Promise<AuthResponse> => {
  const response = await post<AuthResponse>('/auth/register', data, false);
  saveSession(response.token, response.user);
  return response;
};


export const loginUser = async (
  data: LoginData,
): Promise<AuthResponse> => {
  const response = await post<AuthResponse>('/auth/login', data, false);
  saveSession(response.token, response.user);
  return response;
};


export const getMe = (): User | null => {
  try {
    const user = localStorage.getItem('tf_user');
    return user ? (JSON.parse(user) as User) : null;
  } catch {
    return null;
  }
};


export const isAuthenticated = (): boolean =>
  Boolean(getToken() && getMe());


export const logout = (): void => {
  localStorage.removeItem('tf_token');
  localStorage.removeItem('tf_user');
};


// ─────────────────────────────────────────────────────────────────────────────
// TODO 6: Projects API
// ─────────────────────────────────────────────────────────────────────────────

export const fetchProjects = async (): Promise<Project[]> => {
  const data = await get<{ projects: Project[] }>('/projects');
  return data.projects;
};


export const createProject = (
  data: CreateProjectData,
): Promise<Project> => post<Project>('/projects', data);


export const fetchProject = (
  id: string,
): Promise<Project & { tasks: Task[] }> =>
  get<Project & { tasks: Task[] }>(`/projects/${id}`);


export const updateProject = (
  id: string,
  data: UpdateProjectData,
): Promise<Project> => patch<Project>(`/projects/${id}`, data);


export const deleteProject = (id: string): Promise<void> =>
  del<void>(`/projects/${id}`);


// ─────────────────────────────────────────────────────────────────────────────
// TODO 7: Tasks API
// ─────────────────────────────────────────────────────────────────────────────

export const fetchTasks = async (
  projectId: string,
  filters: TaskFilters = {},
): Promise<Task[]> => {
  try {
    const params = new URLSearchParams();

    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.assignee) params.set('assignee', filters.assignee);
    if (filters.search) params.set('search', filters.search);

    const query = params.toString();
    const path = `/projects/${projectId}/tasks${query ? `?${query}` : ''}`;

    const data = await get<{ tasks: Task[] }>(path);
    return data.tasks;
  } catch (error) {
    throw new Error(`Failed to fetch tasks: ${(error as Error).message}`);
  }
};


export const createTask = async (
  projectId: string,
  data: CreateTaskData,
): Promise<Task> => {
  try {
    return await post<Task>(`/projects/${projectId}/tasks`, data);
  } catch (error) {
    throw new Error(`Failed to create task: ${(error as Error).message}`);
  }
};


export const updateTask = async (
  taskId: string,
  data: UpdateTaskData,
): Promise<Task> => {
  try {
    return await patch<Task>(`/tasks/${taskId}`, data);
  } catch (error) {
    throw new Error(`Failed to update task: ${(error as Error).message}`);
  }
};


export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await del<void>(`/tasks/${taskId}`);
  } catch (error) {
    throw new Error(`Failed to delete task: ${(error as Error).message}`);
  }
};