// Mock API — simulates POST /auth/register, POST /auth/login, GET /auth/me
// Replace mock implementation when real backend is ready.

// ── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
}

interface FakeUser extends User {
  password: string;
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

export interface AuthResponse {
  token: string;
  user: User;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const fakeUsers: FakeUser[] = [
  {
    id: 'seed-001',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  },
];

// ── Register ─────────────────────────────────────────────────────────────────

export const registerUser = async ({
  name,
  email,
  password,
}: RegisterData): Promise<AuthResponse> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 800);
  });

  const exists = fakeUsers.find((user) => user.email === email);

  if (exists) {
    throw new Error('Email already registered');
  }

  const user: FakeUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    password,
  };

  fakeUsers.push(user);

  const token = btoa(
    JSON.stringify({
      userId: user.id,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }),
  );

  const sessionUser: User = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(sessionUser));

  return {
    token,
    user: sessionUser,
  };
};

// ── Login ────────────────────────────────────────────────────────────────────

export const loginUser = async ({
  email,
  password,
}: LoginData): Promise<AuthResponse> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 800);
  });

  const user = fakeUsers.find(
    (fakeUser) =>
      fakeUser.email === email &&
      fakeUser.password === password,
  );

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const token = btoa(
    JSON.stringify({
      userId: user.id,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }),
  );

  const sessionUser: User = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(sessionUser));

  return {
    token,
    user: sessionUser,
  };
};

// ── Current User ─────────────────────────────────────────────────────────────

export const getMe = (): User | null => {
  try {
    const user = localStorage.getItem('user');

    return user ? (JSON.parse(user) as User) : null;
  } catch {
    return null;
  }
};

// ── Authentication ───────────────────────────────────────────────────────────

export const isAuthenticated = (): boolean =>
  Boolean(localStorage.getItem('token') && getMe());

// ── Token ────────────────────────────────────────────────────────────────────
// Used by api.ts to attach the Authorization header on Projects/Tasks requests.

export const getToken = (): string | null => localStorage.getItem('token');

// ── Logout ───────────────────────────────────────────────────────────────────

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};