import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Visibility, VisibilityOff, EmailOutlined, LockOutlined } from '@mui/icons-material';
import { useAuth } from '@contexts/AuthContext';
import AuthLayout from '@components/auth/AuthLayout';
import AuthInput from '@components/auth/AuthInput';
import loginBackgroundImage from '../assets/bglogin.png';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        navigate('/dashboard');
      } else {
        setApiError(result.error || 'Login failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login exception:', error);
      setApiError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Login to continue your dyslexia assessment"
      backgroundImage={loginBackgroundImage}
      hideLeftPanel
      centerHeader
      titleClassName="!text-kid-sky !font-kids text-4xl tracking-wide"
      titleStyle={{
        fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", "Baloo 2", cursive'
      }}
      subtitleStyle={{
        fontFamily: '"Comic Sans MS", "Chalkboard SE", "Baloo 2", cursive',
        fontSize: '1rem'
      }}
      contentStyle={{
        fontFamily: '"Comic Sans MS", "Chalkboard SE", "Nunito", sans-serif'
      }}
    >
      <div className="space-y-8">
        {apiError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {apiError}
          </div>
        )}

        <AuthInput
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          autoComplete="email"
          placeholder="you@example.com"
          leftAdornment={<EmailOutlined fontSize="small" className="text-kid-sky" />}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <AuthInput
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          autoComplete="current-password"
          placeholder="Enter your password"
          leftAdornment={<LockOutlined fontSize="small" className="text-kid-sky" />}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          rightAdornment={(
            <button
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              type="button"
              className="rounded-md p-1 text-kid-sky transition hover:bg-slate-100 hover:text-[#4B7CFA]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </button>
          )}
        />

        <button
          disabled={loading}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          type="button"
          className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-kid-sky px-4 text-sm font-semibold text-white shadow-lg shadow-kid-sky/30 transition hover:translate-y-[-1px] hover:bg-[#4B7CFA] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-kid-sky transition hover:text-[#4B7CFA] hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Login;
