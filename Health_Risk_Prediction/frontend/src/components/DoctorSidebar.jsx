import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { doctorAuthService } from '../services/api';

const DoctorSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        doctorAuthService.logout();
        navigate('/doctor/auth');
    };

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header-wrapper">
                <div className="sidebar-logo">
                    <Link to="/doctor/dashboard" title="HealthOracle AI Doctor Portal">
                        <span className="nav-icon" style={{ fontSize: '1.4rem' }}>🩺</span> 
                        <span className="logo-text">Doctor Portal</span>
                    </Link>
                </div>
                <button 
                    className="panel-toggle-btn" 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title="Toggle Sidebar"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            </div>
            <nav className="sidebar-nav">
                <Link to="/doctor/dashboard" className={`sidebar-link ${location.pathname === '/doctor/dashboard' ? 'active' : ''}`} title="Dashboard">
                    <span className="nav-icon">📊</span>
                    <span className="nav-label">Dashboard</span>
                </Link>
            </nav>
            <div className="sidebar-footer">
                <button className="sidebar-logout" onClick={handleLogout} title="Logout">
                    <span className="nav-icon" style={{ display: 'flex', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </span>
                    <span className="nav-label">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default DoctorSidebar;
