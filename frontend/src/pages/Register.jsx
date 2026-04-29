import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Visibility, VisibilityOff, PersonOutline, EmailOutlined, LockOutlined } from '@mui/icons-material';
import { useAuth } from '@contexts/AuthContext';
import AuthLayout from '@components/auth/AuthLayout';
import AuthInput from '@components/auth/AuthInput';
import loginBackgroundImage from '../assets/bglogin.png';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    });

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setApiError(result.error);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Register for dyslexia assessment"
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthInput
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            autoComplete="name"
            placeholder="Full name"
            leftAdornment={<PersonOutline fontSize="small" className="text-kid-sky" />}
          />

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
          />

          <AuthInput
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            autoComplete="new-password"
            placeholder="Create password"
            leftAdornment={<LockOutlined fontSize="small" className="text-kid-sky" />}
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

          <AuthInput
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            autoComplete="new-password"
            placeholder="Confirm password"
            leftAdornment={<LockOutlined fontSize="small" className="text-kid-sky" />}
            rightAdornment={(
              <button
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                type="button"
                className="rounded-md p-1 text-kid-sky transition hover:bg-slate-100 hover:text-[#4B7CFA]"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            )}
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-kid-sky px-4 text-sm font-semibold text-white shadow-lg shadow-kid-sky/30 transition hover:translate-y-[-1px] hover:bg-[#4B7CFA] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-kid-sky transition hover:text-[#4B7CFA] hover:underline">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}

export default Register;
