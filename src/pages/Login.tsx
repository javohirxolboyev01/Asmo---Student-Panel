import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validateEmail } from '../utils/validators';

export default function Login() {
  const navigate = useNavigate();
  const { loginUser, loading, error, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearAuthError();

    // Validation
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    const result = await loginUser(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setFormError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-secondary/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display-lg text-display-lg text-primary mb-2">ASMO</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Learning Center</p>
        </div>

        {/* Login Card */}
        <div className="clay-card rounded-3xl p-8 bg-surface-container/40 backdrop-blur-xl border border-white/5">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 text-center">
            Welcome Back
          </h2>

          {(formError || error) && (
            <div className="mb-4 p-3 bg-error-container/10 border border-error/20 rounded-xl text-error text-sm">
              {formError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant ml-2">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                  mail
                </span>
                <input
                  className="clay-inset w-full rounded-2xl py-4 pl-12 pr-4 text-on-surface font-body-md text-body-md bg-transparent border border-white/5 focus:outline-none focus:border-primary/50 transition-colors"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant ml-2">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                  lock
                </span>
                <input
                  className="clay-inset w-full rounded-2xl py-4 pl-12 pr-4 text-on-surface font-body-md text-body-md bg-transparent border border-white/5 focus:outline-none focus:border-primary/50 transition-colors"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary-fixed transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              className="clay-button w-full py-4 rounded-2xl bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-sm text-on-surface-variant">or</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary-fixed transition-colors font-semibold">
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-surface-container/30 rounded-2xl border border-white/5">
          <p className="text-xs text-on-surface-variant text-center mb-2">
            Demo Credentials:
          </p>
          <p className="text-xs text-on-surface text-center">
            Email: admin@gmail.com | Password: password123
          </p>
        </div>
      </div>
    </div>
  );
}
