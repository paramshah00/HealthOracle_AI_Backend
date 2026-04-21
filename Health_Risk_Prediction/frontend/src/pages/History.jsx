import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authService, predictionService } from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/index.css';

/* ─── History List View ─── */
const HistoryList = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authService.isAuthenticated()) { navigate('/auth'); return; }
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await predictionService.getHistory();
            setHistory(data.predictions);
        } catch (err) {
            console.error('Failed to load history:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRiskClass = (level) => {
        const l = level?.toLowerCase();
        if (l === 'critical') return 'risk-critical';
        if (l === 'high') return 'risk-high';
        if (l === 'moderate') return 'risk-moderate';
        return 'risk-low';
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>📋 Prediction <span className="accent-text">History</span></h1>
                    <p>Review all your past health risk assessments</p>
                </div>

                {loading ? (
                    <div className="loading-center"><div className="loader"></div></div>
                ) : history.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>No predictions yet</h3>
                        <p>Run your first risk assessment to see results here</p>
                        <Link to="/predict"><button className="btn-primary">Make Prediction →</button></Link>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Disease</th>
                                    <th>Result</th>
                                    <th>Probability</th>
                                    <th>Risk Level</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((p, idx) => (
                                    <tr key={p.id}>
                                        <td className="text-muted">{idx + 1}</td>
                                        <td>{p.display_name}</td>
                                        <td>{p.prediction === 1 ? '⚠️ Positive' : '✅ Negative'}</td>
                                        <td>{(p.probability * 100).toFixed(1)}%</td>
                                        <td><span className={`risk-badge ${getRiskClass(p.risk_level)}`}>{p.risk_level}</span></td>
                                        <td>{new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                            <Link to={`/history/${p.id}`} className="table-detail-link">Details →</Link>
                                            <button 
                                                onClick={() => navigate('/ai-chat', { state: { predictionId: p.id } })}
                                                style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: '500' }}
                                                title="Discuss this prediction with AI"
                                            >
                                                🤖 Discuss
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};


/* ─── History Detail View ─── */
const HistoryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = authService.getUser();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authService.isAuthenticated()) { navigate('/auth'); return; }
        loadDetail();
    }, [id]);

    const loadDetail = async () => {
        try {
            const data = await predictionService.getDetail(id);
            setDetail(data);
        } catch (err) {
            console.error('Failed to load detail:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRiskClass = (level) => {
        const l = level?.toLowerCase();
        if (l === 'critical') return 'risk-critical';
        if (l === 'high') return 'risk-high';
        if (l === 'moderate') return 'risk-moderate';
        return 'risk-low';
    };

    const getUrgencyClass = (urgency) => {
        if (urgency === 'urgent') return 'urgency-urgent';
        if (urgency === 'high') return 'urgency-high';
        if (urgency === 'moderate') return 'urgency-moderate';
        return 'urgency-low';
    };

    if (loading) return <div className="dashboard-layout"><div className="loading-center"><div className="loader"></div></div></div>;
    if (!detail) return <div className="dashboard-layout"><div className="dashboard-main"><p>Prediction not found.</p></div></div>;

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                <Link to="/history" className="back-link">← Back to History</Link>

                <div className="detail-header">
                    <h1>{detail.display_name} Risk Assessment</h1>
                    <span className={`risk-badge ${getRiskClass(detail.risk_level)}`}>{detail.risk_level} Risk</span>
                </div>

                <div className="detail-meta">
                    <span>📅 {new Date(detail.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={detail.prediction === 1 ? 'text-danger' : 'text-success'}>
                        {detail.label}
                    </span>
                </div>

                {/* Probability */}
                <div className="detail-card">
                    <h3>Probability Score</h3>
                    <div className="probability-section">
                        <div className="probability-label">
                            <span>Risk Probability</span>
                            <span className="probability-value">{(detail.probability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="probability-bar-track">
                            <div
                                className={`probability-bar-fill ${getRiskClass(detail.risk_level)}`}
                                style={{ width: `${detail.probability * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Input Data */}
                <div className="detail-card">
                    <h3>Input Parameters</h3>
                    <div className="input-data-grid">
                        {Object.entries(detail.input_data || {}).map(([key, val]) => (
                            <div className="input-data-item" key={key}>
                                <span className="input-data-label">{key}</span>
                                <span className="input-data-value">{val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Guidance */}
                <div className={`guidance-box ${getUrgencyClass(detail.guidance?.urgency)}`}>
                    <p className="guidance-summary">{detail.guidance?.summary}</p>
                    <ul className="guidance-list">
                        {detail.guidance?.recommendations?.map((rec, i) => (
                            <li key={i}>{rec}</li>
                        ))}
                    </ul>
                </div>

                {detail.guidance?.show_ai_chat && (
                    <div className="ai-chat-cta">
                        <span>🤖</span>
                        <div>
                            <strong>Want personalized advice?</strong>
                            <p>Chat with our AI Health Assistant about these results</p>
                        </div>
                        <button className="btn-primary btn-sm" onClick={() => navigate('/ai-chat', { state: { predictionId: detail.id } })}>
                            Chat with AI →
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export { HistoryList, HistoryDetail };
