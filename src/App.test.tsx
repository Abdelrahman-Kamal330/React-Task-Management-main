import { render, screen } from '@testing-library/react';
import App from './App';

const goTo = (path: string) => {
  window.history.pushState({}, '', path);
};

const saveTestUser = () => {
  localStorage.setItem('tf_token', 'fake-token');
  localStorage.setItem(
    'tf_user',
    JSON.stringify({ id: 'seed-001', name: 'Test User', email: 'test@example.com' }),
  );
};

describe('App routes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('/login shows the Login page', () => {
    goTo('/login');
    render(<App />);

    expect(screen.getByText('Login')).toBeTruthy();
  });

  test('/register shows the Register page', () => {
    goTo('/register');
    render(<App />);

    expect(screen.getByText('Register')).toBeTruthy();
  });

  test('/forgot-password shows the Forgot Password page', () => {
    goTo('/forgot-password');
    render(<App />);

    expect(screen.getByText('Forgot Password')).toBeTruthy();
  });

  test('/dashboard redirects to Login when nobody is logged in', () => {
    goTo('/dashboard');
    render(<App />);

    expect(screen.getByText('Login')).toBeTruthy();
    expect(screen.queryByText('Dashboard')).toBeNull();
  });

  test('/dashboard shows the Dashboard when the user is logged in', () => {
    saveTestUser();
    goTo('/dashboard');
    render(<App />);

    expect(screen.getByText('Dashboard')).toBeTruthy();
  });

  test('/project/:id redirects to Login when nobody is logged in', () => {
    goTo('/project/proj-001');
    render(<App />);

    expect(screen.getByText('Login')).toBeTruthy();
    expect(screen.queryByText('Project proj-001')).toBeNull();
  });

  test('/project/:id shows the Project page with the project id', () => {
    saveTestUser();
    goTo('/project/proj-001');
    render(<App />);

    expect(screen.getByText('Project proj-001')).toBeTruthy();
  });

  test('an unknown route goes to the Dashboard', () => {
    saveTestUser();
    goTo('/some-page-that-does-not-exist');
    render(<App />);

    expect(screen.getByText('Dashboard')).toBeTruthy();
  });
});
