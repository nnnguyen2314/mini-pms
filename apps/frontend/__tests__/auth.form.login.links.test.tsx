import { render, screen } from '@testing-library/react';
import AuthForm from '../src/features/auth/components/AuthForm';

describe('AuthForm (login links)', () => {
  test('shows Sign Up and Forgot Password links on login mode', () => {
    const onSubmit = jest.fn();
    render(<AuthForm mode="login" onSubmit={onSubmit} />);

    const signUp = screen.getByRole('button', { name: /sign up/i });
    const forgot = screen.getByRole('button', { name: /forgot password/i });

    expect(signUp).toBeInTheDocument();
    expect(forgot).toBeInTheDocument();
    // MUI Button with NextLink renders as anchor under the hood
    expect(signUp).toHaveAttribute('href', '/signup');
    expect(forgot).toHaveAttribute('href', '/forgot-password');
  });
});
