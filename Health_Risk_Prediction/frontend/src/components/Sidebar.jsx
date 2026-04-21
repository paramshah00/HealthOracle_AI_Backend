import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = authService.getUser();
    
    // Support saving collapsed state to localStorage so it persists across reloads
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', isCollapsed);
        // Force re-render of layout margins by toggling a class on the body or handling it in CSS
    }, [isCollapsed]);

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header-wrapper">
                <div className="sidebar-logo">
                    <Link to="/dashboard" title="HealthPredict">
                        <span className="nav-icon" style={{ fontSize: '1.4rem' }}>🩺</span> 
                        <span className="logo-text">HealthPredict</span>
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
                <Link to="/dashboard" className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`} title="Dashboard">
                    <span className="nav-icon">📊</span>
                    <span className="nav-label">Dashboard</span>
                </Link>
                <Link to="/predict" className={`sidebar-link ${location.pathname === '/predict' ? 'active' : ''}`} title="New Prediction">
                    <span className="nav-icon">🧬</span>
                    <span className="nav-label">New Prediction</span>
                </Link>
                <Link to="/history" className={`sidebar-link ${location.pathname.startsWith('/history') ? 'active' : ''}`} title="History">
                    <span className="nav-icon">📋</span>
                    <span className="nav-label">History</span>
                </Link>
                <Link to="/analytics" className={`sidebar-link ${location.pathname === '/analytics' ? 'active' : ''}`} title="Analytics">
                    <span className="nav-icon">📈</span>
                    <span className="nav-label">Analytics</span>
                </Link>
                <Link to="/insights" className={`sidebar-link ${location.pathname === '/insights' ? 'active' : ''}`} title="Community Insights">
                    <span className="nav-icon">🌍</span>
                    <span className="nav-label">Community Insights</span>
                </Link>
                <Link to="/ai-chat" className={`sidebar-link ${location.pathname === '/ai-chat' ? 'active' : ''}`} title="AI Assistant">
                    <span className="nav-icon">🤖</span>
                    <span className="nav-label">AI Assistant</span>
                </Link>
            </nav>
            <div className="sidebar-footer">
                <div className="sidebar-user" title={user?.full_name || 'User'}>
                    <div className="sidebar-avatar">{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.full_name || 'User'}</div>
                        <div className="sidebar-user-email">{user?.email || ''}</div>
                    </div>
                </div>
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

export default Sidebar;
