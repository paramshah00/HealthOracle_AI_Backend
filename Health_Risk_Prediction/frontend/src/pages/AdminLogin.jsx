import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import '../styles/index.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await adminService.login(adminId, password);
            navigate('/admin/dashboard');
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Invalid admin credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <div className="admin-shield-icon">🛡️</div>
                    <h1>Admin Panel</h1>
                    <p>Doctor Management Console</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="admin-login-form">
                    <div className="admin-field">
                        <label htmlFor="admin-id">Admin ID</label>
                        <input
                            id="admin-id"
                            type="text"
                            value={adminId}
                            onChange={(e) => setAdminId(e.target.value)}
                            placeholder="Enter admin ID"
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div className="admin-field">
                        <label htmlFor="admin-password">Password</label>
                        <input
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit" className="btn-primary admin-login-btn" disabled={loading}>
                        {loading ? <div className="loader"></div> : 'Sign in as Admin →'}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <a href="/" className="admin-back-link">← Back to HealthOracle AI</a>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
