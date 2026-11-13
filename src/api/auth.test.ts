import {
  registerUser,
  loginUser,
  getMe,
  isAuthenticated,
  logout,
  getToken,
} from './auth';

describe('auth.ts', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('isAuthenticated is false when nobody logged in yet', () => {
    expect(isAuthenticated()).toBe(false);
    expect(getToken()).toBeNull();
    expect(getMe()).toBeNull();
  });

  test('loginUser works with the seeded test user', async () => {
    const result = await loginUser({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toBeTruthy();
    expect(isAuthenticated()).toBe(true);
  });

  test('loginUser throws an error with a wrong password', async () => {
    await expect(
      loginUser({ email: 'test@example.com', password: 'wrong-password' }),
    ).rejects.toThrow('Invalid email or password');
  });

  test('registerUser creates a new user and logs them in', async () => {
    const result = await registerUser({
      name: 'New User',
      email: 'new-user@example.com',
      password: '123456',
    });

    expect(result.user.email).toBe('new-user@example.com');
    expect(getMe()?.email).toBe('new-user@example.com');
  });

  test('registerUser throws an error when the email is already taken', async () => {
    await expect(
      registerUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow('Email already registered');
  });

  test('logout clears the session', async () => {
    await loginUser({ email: 'test@example.com', password: 'password123' });
    expect(isAuthenticated()).toBe(true);

    logout();

    expect(isAuthenticated()).toBe(false);
    expect(getMe()).toBeNull();
  });
});
