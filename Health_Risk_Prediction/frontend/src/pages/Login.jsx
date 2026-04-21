import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/index.css';

/* ─── Password strength calculator ─── */
function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (pw.length >= 12) score++;
    if (score <= 1) return { level: 'weak', label: 'Weak' };
    if (score === 2) return { level: 'fair', label: 'Fair' };
    if (score === 3) return { level: 'good', label: 'Good' };
    return { level: 'strong', label: 'Strong' };
}

/* ─── Real-time validators ─── */
function validateField(name, value, regData) {
    switch (name) {
        case 'phone': {
            const cleaned = value.replace(/\D/g, '');
            if (cleaned.length > 0 && cleaned.length !== 10)
                return 'Phone number must be exactly 10 digits';
            return '';
        }
        case 'password': {
            const errs = [];
            if (value.length > 0 && value.length < 8)
                errs.push('At least 8 characters');
            if (value.length >= 1 && !/[a-zA-Z]/.test(value))
                errs.push('At least 1 letter');
            if (value.length >= 1 && !/\d/.test(value))
                errs.push('At least 1 digit');
            if (value.length >= 1 && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value))
                errs.push('At least 1 special character');
            return errs.join(' • ');
        }
        case 'confirm_password': {
            if (value && value !== regData?.password)
                return 'Passwords do not match';
            return '';
        }
        case 'age': {
            const n = parseInt(value);
            if (value && (isNaN(n) || n < 5 || n > 100))
                return 'Age must be between 5 and 100';
            return '';
        }
        case 'email': {
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                return 'Enter a valid email address';
            return '';
        }
        default:
            return '';
    }
}

/* ─── Eye Icons ─── */
const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const Auth = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    // Password visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Login
    const [username, setUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Registration
    const [regData, setRegData] = useState({
        full_name: '', email: '', phone: '', age: '', gender: '', password: '', confirm_password: ''
    });

    const passwordStrength = useMemo(() => getPasswordStrength(regData.password), [regData.password]);

    const handleRegChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const digits = value.replace(/\D/g, '').slice(0, 10);
            setRegData(prev => ({ ...prev, [name]: digits }));
        } else {
            setRegData(prev => ({ ...prev, [name]: value }));
        }
        const err = validateField(name, name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value, { ...regData, [name]: value });
        setFieldErrors(prev => ({ ...prev, [name]: err }));
    };

    const isRegFormValid = useMemo(() => {
        const d = regData;
        if (!d.full_name || !d.email || !d.phone || !d.password || !d.confirm_password) return false;
        if (d.phone.length !== 10) return false;
        if (d.password.length < 8) return false;
        if (!/[a-zA-Z]/.test(d.password)) return false;
        if (!/\d/.test(d.password)) return false;
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(d.password)) return false;
        if (d.password !== d.confirm_password) return false;
        if (d.age && (parseInt(d.age) < 5 || parseInt(d.age) > 100)) return false;
        return true;
    }, [regData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);
        setLoading(true);

        try {
            if (isLogin) {
                await authService.login(username, loginPassword);
                navigate('/dashboard');
            } else {
                const res = await authService.register(regData);
                setIsLogin(true);
                setRegData({ full_name: '', email: '', phone: '', age: '', gender: '', password: '', confirm_password: '' });
                setFieldErrors({});
                setShowPassword(false);
                setShowConfirmPassword(false);

                let msg = res.message || 'Registration successful! Please login.';
                if (res.password_warnings?.length) {
                    msg += ' ⚠️ ' + res.password_warnings.join(', ');
                }
                setAlert({ type: 'success', message: msg });
                setTimeout(() => setAlert(null), 5000);
            }
        } catch (err) {
            const detail = err.response?.data?.detail;
            let message = 'An error occurred. Please try again.';
            if (typeof detail === 'string') {
                message = detail;
            } else if (Array.isArray(detail)) {
                message = detail.map(e => e.msg?.replace('Value error, ', '')).join('; ');
            }
            setAlert({ type: 'error', message });
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setAlert(null);
        setFieldErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        setShowLoginPassword(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <Link to="/" className="auth-back-link">← Back to Home</Link>

                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="auth-subtitle">
                    {isLogin
                        ? 'Sign in with your email or phone number'
                        : 'Fill in your details to get started'}
                </p>

                {alert && (
                    <div className={`alert alert-${alert.type}`}>
                        {alert.message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {isLogin ? (
                        <>
                            <div className="input-group">
                                <label>Email or Phone Number</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="you@email.com or 9876543210"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showLoginPassword ? 'text' : 'password'}
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        tabIndex={-1}
                                    >
                                        {showLoginPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="input-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={regData.full_name}
                                    onChange={handleRegChange}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div className="input-row">
                                <div className={`input-group half ${fieldErrors.email ? 'error' : ''}`}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={regData.email}
                                        onChange={handleRegChange}
                                        placeholder="you@email.com"
                                        required
                                    />
                                    {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
                                </div>
                                <div className={`input-group half ${fieldErrors.phone ? 'error' : ''}`}>
                                    <label>Phone</label>
                                    <div className="phone-input-wrapper">
                                        <div className="phone-prefix">🇮🇳 +91</div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={regData.phone}
                                            onChange={handleRegChange}
                                            placeholder="9876543210"
                                            maxLength={10}
                                            required
                                        />
                                    </div>
                                    {fieldErrors.phone && <div className="field-error">{fieldErrors.phone}</div>}
                                </div>
                            </div>

                            <div className="input-row">
                                <div className={`input-group half ${fieldErrors.age ? 'error' : ''}`}>
                                    <label>Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={regData.age}
                                        onChange={handleRegChange}
                                        placeholder="25"
                                        min="5"
                                        max="100"
                                    />
                                    {fieldErrors.age && <div className="field-error">{fieldErrors.age}</div>}
                                </div>
                                <div className="input-group half">
                                    <label>Gender</label>
                                    <select
                                        name="gender"
                                        value={regData.gender}
                                        onChange={handleRegChange}
                                        className="select-input"
                                    >
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className={`input-group ${fieldErrors.password ? 'error' : ''}`}>
                                <label>Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={regData.password}
                                        onChange={handleRegChange}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                                {regData.password && (
                                    <div className="password-strength">
                                        <div className="strength-bar-track">
                                            <div className={`strength-bar-fill ${passwordStrength.level}`}></div>
                                        </div>
                                        <div className={`strength-label ${passwordStrength.level}`}>
                                            {passwordStrength.label}
                                        </div>
                                    </div>
                                )}
                                {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
                            </div>

                            <div className={`input-group ${fieldErrors.confirm_password ? 'error' : ''}`}>
                                <label>Confirm Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirm_password"
                                        value={regData.confirm_password}
                                        onChange={handleRegChange}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                                {fieldErrors.confirm_password && <div className="field-error">{fieldErrors.confirm_password}</div>}
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="auth-btn"
                        disabled={loading || (!isLogin && !isRegFormValid)}
                    >
                        {loading ? <div className="loader"></div> : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="switch-auth">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}
                    <button onClick={switchMode}>
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
