import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n/I18nProvider';
import { RegisterData } from '../types/auth';
import { SuccessModal } from '../components/atoms/SuccessModal';

export function RegisterPage() {
  const { t } = useTranslation();
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    nickname: '',
    age: 0,
    gender: undefined
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = t('auth.register.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.register.errors.emailInvalid');
    }

    if (!formData.nickname) {
      newErrors.nickname = t('auth.register.errors.nicknameRequired');
    } else if (formData.nickname.length < 2) {
      newErrors.nickname = t('auth.register.errors.nicknameTooShort');
    }

    if (!formData.password) {
      newErrors.password = t('auth.register.errors.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.register.errors.passwordTooShort');
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.register.errors.passwordMismatch');
    }

    if (!formData.age || formData.age < 13) {
      newErrors.age = t('auth.register.errors.ageRequired');
    } else if (formData.age > 120) {
      newErrors.age = t('auth.register.errors.ageInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      setShowSuccessModal(true);
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/journal');
      }, 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? parseInt(value) || 0 : value;

    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{t('auth.register.title')}</h1>
          <p>{t('auth.register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">{t('auth.register.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              disabled={isLoading}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="nickname">{t('auth.register.nickname')}</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              className={errors.nickname ? 'error' : ''}
              disabled={isLoading}
              required
            />
            {errors.nickname && <span className="error-message">{errors.nickname}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="age">{t('auth.register.age')}</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age || ''}
              onChange={handleChange}
              className={errors.age ? 'error' : ''}
              disabled={isLoading}
              min="13"
              max="120"
              required
            />
            {errors.age && <span className="error-message">{errors.age}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="gender">{t('auth.register.gender')}</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender || ''}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="">{t('auth.register.genderOptions.prefer')}</option>
              <option value="female">{t('auth.register.genderOptions.female')}</option>
              <option value="male">{t('auth.register.genderOptions.male')}</option>
              <option value="other">{t('auth.register.genderOptions.other')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.register.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              disabled={isLoading}
              required
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.register.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
              disabled={isLoading}
              required
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {submitError && (
            <div className="error-message submit-error">{submitError}</div>
          )}

          <button
            type="submit"
            className="auth-button primary"
            disabled={isLoading}
          >
            {isLoading ? t('auth.register.submitLoading') : t('auth.register.submit')}
          </button>
        </form>

        <div className="auth-links">
          <p>
            {t('auth.register.haveAccount')}{' '}
            <Link to="/login" className="auth-link">
              {t('auth.register.signin')}
            </Link>
          </p>
        </div>
      </div>
      {showSuccessModal && (
        <SuccessModal
          message={t('auth.register.success')}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
}