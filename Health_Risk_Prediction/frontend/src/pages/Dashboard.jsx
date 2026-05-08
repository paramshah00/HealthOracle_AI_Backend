import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, predictionService } from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/index.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({ total: 0, highRisk: 0, latestRisk: '—' });

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate('/auth');
            return;
        }
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await predictionService.getHistory();
            // Sort by date descending (most recent first)
            const sorted = [...data.predictions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setHistory(sorted);
            const total = data.total;
            const highRisk = sorted.filter(p => p.probability >= 0.5).length;
            const latest = sorted.length > 0 ? sorted[0].risk_level : '—';
            setStats({ total, highRisk, latestRisk: latest });
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    const getRiskClass = (level) => {
        const l = level?.toLowerCase();
        if (l === 'critical') return 'risk-critical';
        if (l === 'high') return 'risk-high';
        if (l === 'moderate') return 'risk-moderate';
        return 'risk-low';
    };

    const firstName = user?.full_name?.split(' ')[0] || 'there';

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Hey, <span className="accent-text">{firstName}</span></h1>
                    <p>Here's where your health numbers stand right now.</p>
                </div>

                {/* ─── STATS CARDS ─── */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">🔬</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">Predictions run</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.highRisk}</div>
                            <div className="stat-label">Elevated results</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.latestRisk}</div>
                            <div className="stat-label">Latest risk level</div>
                        </div>
                    </div>
                    <div className="stat-card stat-card-cta">
                        <Link to="/predict" className="stat-cta-link">
                            <div className="stat-icon">➕</div>
                            <div className="stat-info">
                                <div className="stat-value">New</div>
                                <div className="stat-label">Run a prediction</div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* ─── RECENT PREDICTIONS ─── */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>Recent predictions</h2>
                        {history.length > 0 && <Link to="/history" className="section-link">View all →</Link>}
                    </div>

                    {history.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">🔬</span>
                            <h3>Nothing here yet</h3>
                            <p>Run your first health risk assessment to get started.</p>
                            <Link to="/predict"><button className="btn-primary">Run a prediction →</button></Link>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Disease</th>
                                        <th>Risk level</th>
                                        <th>Probability</th>
                                        <th>Date</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.slice(0, 5).map((p) => (
                                        <tr key={p.id}>
                                            <td>{p.display_name}</td>
                                            <td><span className={`risk-badge ${getRiskClass(p.risk_level)}`}>{p.risk_level}</span></td>
                                            <td>{(p.probability * 100).toFixed(1)}%</td>
                                            <td>{new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td><Link to={`/history/${p.id}`} className="table-detail-link">Details →</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
