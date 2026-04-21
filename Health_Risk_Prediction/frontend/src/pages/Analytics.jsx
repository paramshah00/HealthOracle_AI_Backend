import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, analyticsService } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    RadialBarChart, RadialBar
} from 'recharts';
import '../styles/index.css';

const Analytics = () => {
    const navigate = useNavigate();
    const [allData, setAllData] = useState({});
    const [selectedDisease, setSelectedDisease] = useState('');
    const [data, setData] = useState({ trends: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authService.isAuthenticated()) { navigate('/auth'); return; }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await analyticsService.getPersonalAnalytics();
            
            const formattedData = {};
            let firstDisease = '';
            
            for (const [disease, diseaseInfo] of Object.entries(res)) {
                if (!firstDisease) firstDisease = disease;
                
                formattedData[disease] = {
                    ...diseaseInfo,
                    trends: diseaseInfo.trends.map(t => {
                        const dateObj = new Date(t.date);
                        
                        // Parse metrics so "Yes"/"No" strings become chartable numbers (1/0)
                        const parsedMetrics = {};
                        for (const [k, v] of Object.entries(t.metrics || {})) {
                            let parsedValue = v;
                            if (typeof v === 'string') {
                                const lower = v.toLowerCase().trim();
                                if (lower === 'yes' || lower === 'true') parsedValue = 1;
                                else if (lower === 'no' || lower === 'false') parsedValue = 0;
                                else if (!isNaN(parseFloat(v))) parsedValue = parseFloat(v);
                            }
                            parsedMetrics[k] = parsedValue;
                        }

                        return {
                            ...t,
                            displayDate: dateObj.toLocaleString('en-IN', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: 'numeric', 
                                minute: '2-digit' 
                            }),
                            probabilityPercent: parseFloat((t.probability * 100).toFixed(1)),
                            ...parsedMetrics
                        };
                    })
                };
            }
            
            setAllData(formattedData);
            if (firstDisease) {
                setSelectedDisease(firstDisease);
                setData(formattedData[firstDisease]);
            }
        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="dashboard-layout"><div className="loading-center"><div className="loader"></div></div></div>;

    if (Object.keys(allData).length === 0 || data.trends.length === 0) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-main">
                    <div className="dashboard-header">
                        <h1>Personal <span className="accent-text">Analytics</span></h1>
                        <p>Track your health trends over time</p>
                    </div>
                    <div className="empty-state">
                        <div className="empty-icon">📈</div>
                        <h3>Not enough data</h3>
                        <p>Complete at least one health risk prediction to view your historical trends.</p>
                    </div>
                </main>
            </div>
        );
    }

    // Determine all available metric fields from the first trend entry (excluding pregnancies, age, sex)
    const allMetrics = data.trends.length > 0 ? Object.keys(data.trends[0].metrics) : [];
    const fieldsToTrack = allMetrics.filter(m => {
        const lower = m.toLowerCase();
        return lower !== 'pregnancies' && lower !== 'age' && lower !== 'sex' && lower !== 'gender';
    });
    
    // Simple AI heuristic generating a summary
    const generateAIAssistantSummary = () => {
        if (data.trends.length < 2) return `I need more than one ${selectedDisease.replace(/_/g, ' ')} prediction record to analyze your progress over time. Keep logging!`;
        const first = data.trends[0];
        const last = data.trends[data.trends.length - 1];
        const probDiff = last.probabilityPercent - first.probabilityPercent;
        
        let summary = `You have logged ${data.trends.length} predictions for ${selectedDisease.replace(/_/g, ' ')}. `;
        if (probDiff < -5) {
            summary += `Fantastic work! Your overall risk probability has significantly decreased by ${Math.abs(probDiff).toFixed(1)}% since your first reading. Keep maintaining your healthy habits!`;
        } else if (probDiff > 5) {
            summary += `I noticed your risk probability has increased by ${Math.abs(probDiff).toFixed(1)}% since your first reading. It's highly recommended to consult a doctor and review your lifestyle factors moving forward.`;
        } else {
            summary += `Your risk probability has remained relatively stable (currently at ${last.probabilityPercent}%). Tracking your individual fields below can help identify specific areas for improvement.`;
        }
        return summary;
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Personal <span className="accent-text">Analytics</span></h1>
                    <p>Track your health improvements and risk trends over time</p>
                </div>

                {/* Disease Selector */}
                {Object.keys(allData).length > 1 && (
                    <div className="disease-selector" style={{ marginBottom: '1.5rem' }}>
                        {Object.keys(allData).map(disease => (
                            <button
                                key={disease}
                                className={`disease-chip ${selectedDisease === disease ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedDisease(disease);
                                    setData(allData[disease]);
                                }}
                            >
                                {disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                )}

                <div className="analytics-grid">
                    {/* Overall Risk Probability Trend */}
                    <div className="analytics-card full-width">
                        <h3>Risk Probability Trend ({selectedDisease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})</h3>
                        <div className="chart-container" style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="displayDate" stroke="var(--text-secondary)" />
                                    <YAxis stroke="var(--text-secondary)" unit="%" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="probabilityPercent" name="Risk Probability (%)" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="full-width" style={{ marginTop: '2rem', marginBottom: '0.5rem', gridColumn: '1 / -1' }}>
                        <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            Detailed Metrics Breakdown
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            Individual tracking for each of your specific health parameters.
                        </p>
                    </div>

                    {/* Individual Parameter Trends */}
                    {fieldsToTrack.map(field => (
                        <div className="analytics-card" key={field}>
                            <h3>{field} History</h3>
                            <div className="chart-container" style={{ height: '220px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                        <XAxis dataKey="displayDate" stroke="var(--text-secondary)" hide />
                                        <YAxis stroke="var(--text-secondary)" />
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                                        <Line type="monotone" dataKey={field} name={field} stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trend Summary Box */}
                <div className="guidance-box ai-assistant-box" style={{ marginTop: '2rem', borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📊 Trend Summary
                    </h3>
                    <p className="guidance-summary" style={{ lineHeight: '1.6' }}>
                        {generateAIAssistantSummary()}
                    </p>
                </div>

                {/* Individual Record Probabilities out of 100% */}
                <div className="analytics-card full-width" style={{ marginTop: '2rem' }}>
                    <h3>Probability per Past Record (out of 100%)</h3>
                    <div className="insights-controls" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                        {data.trends.map((rec, idx) => (
                            <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', width: '220px', backgroundColor: 'var(--bg-secondary)', flex: '1 1 200px' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                    {rec.displayDate}
                                </h4>
                                <div style={{ height: '160px', position: 'relative' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart 
                                            cx="50%" 
                                            cy="50%" 
                                            innerRadius="80%" 
                                            outerRadius="100%" 
                                            barSize={10} 
                                            data={[{ 
                                                name: 'Probability', 
                                                value: rec.probabilityPercent, 
                                                fill: rec.probabilityPercent >= 70 ? '#ef4444' : rec.probabilityPercent >= 40 ? '#f59e0b' : '#10b981' 
                                            }]}
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            <RadialBar
                                                minAngle={15}
                                                background={{ fill: '#334155' }}
                                                clockWise={true}
                                                dataKey="value"
                                                cornerRadius={10}
                                            />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                                        {rec.probabilityPercent}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Assistant Option Placeholder */}
                <div className="analytics-card full-width" style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem', border: '1px dashed var(--accent-primary)', backgroundColor: 'rgba(37, 99, 235, 0.05)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤖</div>
                    <h3 style={{ color: 'var(--text-primary)' }}>AI Health Assistant</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem auto', lineHeight: '1.6' }}>
                        Ready to dive deeper? Chat with our AI to generate custom forecast charts, ask specific questions about your metrics, and receive personalized diet plans based on your historical data.
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/ai-chat')}>
                        Chat with AI Assistant →
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Analytics;
