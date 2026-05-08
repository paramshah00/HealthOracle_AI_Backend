import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doctorAuthService } from '../services/api';
import '../styles/index.css';

const SPECIALIZATIONS = [
    'Cardiologist', 'Dermatologist', 'Endocrinologist', 'Diabetologist',
    'Gastroenterologist', 'General Physician', 'Nephrologist',
    'Neurologist', 'Oncologist', 'Orthopedic', 'Pediatrician',
    'Psychiatrist', 'Pulmonologist', 'Urologist',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DoctorAuth = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);

    // Login state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register state
    const [reg, setReg] = useState({
        name: '', email: '', phone: '', password: '',
        specialization: '', qualification: '', experience_years: '',
        hospital: '', location: '', consultation_fee: '',
        time_slot_start: '', time_slot_end: '', bio: '',
    });
    const [selectedDays, setSelectedDays] = useState([]);

    const handleRegChange = (e) => {
        const { name, value } = e.target;
        setReg(prev => ({ ...prev, [name]: value }));
    };

    const toggleDay = (day) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);
        setLoading(true);

        try {
            if (isLogin) {
                await doctorAuthService.login(loginEmail, loginPassword);
                navigate('/doctor/dashboard');
            } else {
                const payload = {
                    ...reg,
                    experience_years: parseInt(reg.experience_years) || 0,
                    consultation_fee: parseFloat(reg.consultation_fee) || 0,
                    available_days: selectedDays.join(','),
                };
                const res = await doctorAuthService.register(payload);
                setIsLogin(true);
                setAlert({ type: 'success', message: res.message || 'Registration successful! Please login.' });
                setReg({
                    name: '', email: '', phone: '', password: '',
                    specialization: '', qualification: '', experience_years: '',
                    hospital: '', location: '', consultation_fee: '',
                    time_slot_start: '', time_slot_end: '', bio: '',
                });
                setSelectedDays([]);
            }
        } catch (err) {
            const detail = err.response?.data?.detail;
            let message = 'An error occurred. Please try again.';
            if (typeof detail === 'string') message = detail;
            else if (Array.isArray(detail)) message = detail.map(e => e.msg?.replace('Value error, ', '')).join('; ');
            setAlert({ type: 'error', message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <style>{`
                .day-selector { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.4rem; }
                .day-chip {
                    padding: 0.4rem 0.8rem;
                    border-radius: 99px;
                    border: 1px solid var(--border);
                    background: transparent;
                    color: var(--text-2);
                    font-size: 0.78rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: var(--transition);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                }
                .day-chip.active {
                    background: var(--accent-dim);
                    border-color: var(--accent);
                    color: var(--accent);
                }
                .day-chip:hover { border-color: var(--accent); }
                .time-row { display: flex; gap: 0.8rem; }
                .time-row .input-group { flex: 1; }
                .doctor-auth-box {
                    max-width: 580px !important;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .doctor-auth-box::-webkit-scrollbar { width: 4px; }
                .doctor-auth-box::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 99px; }
            `}</style>

            <div className="auth-box doctor-auth-box">
                <Link to="/" className="auth-back-link">← Back to Home</Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '1.6rem' }}>👨‍⚕️</span>
                    <h2 style={{ margin: 0 }}>{isLogin ? 'Doctor Login' : 'Doctor Registration'}</h2>
                </div>
                <p className="auth-subtitle">
                    {isLogin
                        ? 'Sign in to manage your profile and appointments'
                        : 'Register to join our platform and start receiving patients'}
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
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    placeholder="doctor@hospital.com"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Personal Info */}
                            <div className="input-group">
                                <label>Full Name</label>
                                <input type="text" name="name" value={reg.name} onChange={handleRegChange} placeholder="Dr. John Smith" required />
                            </div>

                            <div className="input-row">
                                <div className="input-group half">
                                    <label>Email</label>
                                    <input type="email" name="email" value={reg.email} onChange={handleRegChange} placeholder="doctor@hospital.com" required />
                                </div>
                                <div className="input-group half">
                                    <label>Phone</label>
                                    <input type="tel" name="phone" value={reg.phone} onChange={handleRegChange} placeholder="9876543210" required />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Password</label>
                                <input type="password" name="password" value={reg.password} onChange={handleRegChange} placeholder="At least 8 characters" required />
                            </div>

                            {/* Professional Info */}
                            <div className="input-row">
                                <div className="input-group half">
                                    <label>Specialization</label>
                                    <select name="specialization" value={reg.specialization} onChange={handleRegChange} className="select-input" required>
                                        <option value="">Select</option>
                                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="input-group half">
                                    <label>Qualification</label>
                                    <input type="text" name="qualification" value={reg.qualification} onChange={handleRegChange} placeholder="MBBS, MD" required />
                                </div>
                            </div>

                            <div className="input-row">
                                <div className="input-group half">
                                    <label>Experience (years)</label>
                                    <input type="number" name="experience_years" value={reg.experience_years} onChange={handleRegChange} placeholder="5" min="0" max="60" required />
                                </div>
                                <div className="input-group half">
                                    <label>Consultation Fee (₹)</label>
                                    <input type="number" name="consultation_fee" value={reg.consultation_fee} onChange={handleRegChange} placeholder="500" min="0" />
                                </div>
                            </div>

                            <div className="input-row">
                                <div className="input-group half">
                                    <label>Hospital / Clinic</label>
                                    <input type="text" name="hospital" value={reg.hospital} onChange={handleRegChange} placeholder="City Hospital" required />
                                </div>
                                <div className="input-group half">
                                    <label>Location</label>
                                    <input type="text" name="location" value={reg.location} onChange={handleRegChange} placeholder="Mumbai, India" required />
                                </div>
                            </div>

                            {/* Time Slots */}
                            <div className="time-row">
                                <div className="input-group">
                                    <label>Slot Start Time</label>
                                    <input type="text" name="time_slot_start" value={reg.time_slot_start} onChange={handleRegChange} placeholder="9:00 AM" required />
                                </div>
                                <div className="input-group">
                                    <label>Slot End Time</label>
                                    <input type="text" name="time_slot_end" value={reg.time_slot_end} onChange={handleRegChange} placeholder="1:00 PM" required />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Available Days</label>
                                <div className="day-selector">
                                    {DAYS.map(day => (
                                        <button
                                            type="button"
                                            key={day}
                                            className={`day-chip ${selectedDays.includes(day) ? 'active' : ''}`}
                                            onClick={() => toggleDay(day)}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Bio (Optional)</label>
                                <input type="text" name="bio" value={reg.bio} onChange={handleRegChange} placeholder="Brief introduction about yourself..." />
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading ? <div className="loader"></div> : (isLogin ? 'Sign In' : 'Register')}
                    </button>
                </form>

                <div className="switch-auth">
                    {isLogin ? "Don't have an account?" : 'Already registered?'}
                    <button onClick={() => { setIsLogin(!isLogin); setAlert(null); }}>
                        {isLogin ? 'Register' : 'Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorAuth;
