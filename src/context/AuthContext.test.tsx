import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const TestComponent = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>{user ? user.name : 'No user'}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const saveTestUser = () => {
  localStorage.setItem('tf_token', 'fake-token');
  localStorage.setItem(
    'tf_user',
    JSON.stringify({ id: 'seed-001', name: 'Test User', email: 'test@example.com' }),
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('shows No user when nobody is logged in', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByText('No user')).toBeTruthy();
  });

  test('shows the user saved in localStorage', () => {
    saveTestUser();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByText('Test User')).toBeTruthy();
  });

  test('logout removes the user', () => {
    saveTestUser();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText('Logout'));

    expect(screen.getByText('No user')).toBeTruthy();
    expect(localStorage.getItem('tf_token')).toBeNull();
  });
});
