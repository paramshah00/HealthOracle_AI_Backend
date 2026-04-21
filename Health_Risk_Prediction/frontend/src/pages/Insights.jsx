import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, analyticsService } from '../services/api';
import Sidebar from '../components/Sidebar';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import '../styles/index.css';

const Insights = () => {
    const navigate = useNavigate();
    const [allPublicData, setAllPublicData] = useState({});
    const [allPersonalData, setAllPersonalData] = useState({});
    const [selectedDisease, setSelectedDisease] = useState('');
    
    const [publicData, setPublicData] = useState(null);
    const [userHistory, setUserHistory] = useState([]);
    const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
    const [comparisonGroup, setComparisonGroup] = useState('high'); // 'high' | 'low'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authService.isAuthenticated()) { navigate('/auth'); return; }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [pubAnalytics, persAnalytics] = await Promise.all([
                analyticsService.getPublicAnalytics(),
                analyticsService.getPersonalAnalytics()
            ]);
            
            setAllPublicData(pubAnalytics);
            setAllPersonalData(persAnalytics);
            
            const diseases = Object.keys(persAnalytics);
            if (diseases.length > 0) {
                const first = diseases[0];
                selectDisease(first, pubAnalytics, persAnalytics);
            }
        } catch (err) {
            console.error('Failed to load insights:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectDisease = (disease, pubObj = allPublicData, persObj = allPersonalData) => {
        setSelectedDisease(disease);
        
        const pub = pubObj[disease];
        const pers = persObj[disease];
        
        setPublicData(pub || null);
        
        if (pers && pers.trends && pers.trends.length > 0) {
            const history = pers.trends.map(t => ({
                ...t,
                probabilityPercent: (parseFloat(t.probability) * 100).toFixed(1),
                displayDate: new Date(t.date).toLocaleString('en-IN', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit'
                })
            }));
            setUserHistory(history);
            setSelectedRecordIndex(history.length - 1);
        } else {
            setUserHistory([]);
            setSelectedRecordIndex(0);
        }
    };

    if (loading) return <div className="dashboard-layout"><div className="loading-center"><div className="loader"></div></div></div>;

    if (Object.keys(allPersonalData).length === 0 || userHistory.length === 0 || !publicData) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-main">
                    <div className="dashboard-header">
                        <h1>Community <span className="accent-text">Insights</span></h1>
                        <p>Compare your metrics against typical patients</p>
                    </div>
                    <div className="empty-state">
                        <div className="empty-icon">🌍</div>
                        <h3>No data available</h3>
                        <p>Complete your first prediction to see how you compare against the system averages.</p>
                    </div>
                </main>
            </div>
        );
    }

    const selectedRecord = userHistory[selectedRecordIndex];
    const userMetrics = selectedRecord.metrics;
    
    // Build chart data
    const chartData = [];
    const targetAverages = comparisonGroup === 'high' ? publicData.high_risk_averages : publicData.low_risk_averages;
    
    // Explicitly exclude 'Pregnancies', 'Age', 'Sex' from comparison
    const validKeys = Object.keys(userMetrics).filter(k => {
        const lower = k.toLowerCase();
        return lower !== 'pregnancies' && lower !== 'age' && lower !== 'sex' && lower !== 'gender' && targetAverages?.[k] !== undefined;
    });

    for (const key of validKeys) {
        chartData.push({
            name: key,
            YourMetric: parseFloat(userMetrics[key] || 0),
            AverageMetric: parseFloat(targetAverages[key] || 0)
        });
    }

    const generateDynamicAISuggestions = () => {
        const warnings = [];
        const praises = [];
        
        for (const item of chartData) {
            const diff = item.YourMetric - item.AverageMetric;
            
            if (comparisonGroup === 'high') {
                // When comparing to High-Risk, we want user metrics to be LOWER.
                if (item.YourMetric >= item.AverageMetric) {
                    warnings.push(`Your ${item.name} (${item.YourMetric}) is higher or equal to the high-risk average (${item.AverageMetric}). Immediate intervention is strongly recommended.`);
                } else if (item.YourMetric >= item.AverageMetric * 0.8) {
                    warnings.push(`Your ${item.name} is approaching the high-risk average. Please monitor this closely.`);
                } else {
                    praises.push(`Your ${item.name} is safely below the high-risk threshold.`);
                }
            } else {
                // When comparing to Low-Risk, typical positive metrics should be close to average. 
                // For factors like Glucose/BMI/BloodPressure, higher is worse.
                if (item.YourMetric > item.AverageMetric * 1.1) {
                    warnings.push(`Your ${item.name} (${item.YourMetric}) is elevated compared to the healthy low-risk average (${item.AverageMetric}). Focus on lifestyle changes to bring this down.`);
                } else if (item.YourMetric < item.AverageMetric * 0.9 && item.name !== 'Insulin') {
                     // For things that shouldn't be too low
                     praises.push(`Your ${item.name} is excellent and below the low-risk average!`);
                } else {
                    praises.push(`Your ${item.name} is perfectly aligned with the healthy group.`);
                }
            }
        }

        // Just take the top 3 most critical warnings to avoid overwhelming the user
        const topWarnings = warnings.slice(0, 3);
        const topPraises = praises.slice(0, 2);

        return (
            <div className={`guidance-box ${comparisonGroup === 'high' ? 'urgency-high' : ''}`} style={{ marginTop: '2rem', borderColor: comparisonGroup === 'low' ? '#10b981' : undefined, backgroundColor: comparisonGroup === 'low' ? 'rgba(16, 185, 129, 0.05)' : undefined }}>
                <h3 style={{ marginTop: 0, color: comparisonGroup === 'low' ? '#10b981' : undefined, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {comparisonGroup === 'high' ? `⚠️ Warning Signs & Immediate Actions (${selectedDisease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})` : `🌱 Daily Lifestyle & Healthy Habits (${selectedDisease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})`}
                </h3>
                <p className="guidance-summary">
                    {comparisonGroup === 'high' 
                        ? "I have analyzed your specific metrics against the High-Risk patient pool:" 
                        : "Here is your personalized roadmap to match the Low-Risk healthy baseline:"}
                </p>
                <ul className="guidance-list">
                    {topWarnings.length > 0 ? (
                        topWarnings.map((w, idx) => <li key={`w-${idx}`} style={{color: comparisonGroup === 'high' ? 'inherit' : '#ef4444'}}><strong>Action Needed:</strong> {w}</li>)
                    ) : (
                        <li><strong>Excellent:</strong> You have no critical warning metrics in this comparison!</li>
                    )}
                    {topPraises.length > 0 && topWarnings.length < 3 && (
                        topPraises.map((p, idx) => <li key={`p-${idx}`}><strong>Positive:</strong> {p}</li>)
                    )}
                </ul>
            </div>
        );
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Community <span className="accent-text">Insights</span></h1>
                    <p>Compare your specific historical records against system-wide anonymized averages</p>
                </div>

                {/* Disease Selector */}
                {Object.keys(allPersonalData).length > 1 && (
                    <div className="disease-selector" style={{ marginBottom: '1.5rem' }}>
                        {Object.keys(allPersonalData).map(disease => (
                            <button
                                key={disease}
                                className={`disease-chip ${selectedDisease === disease ? 'active' : ''}`}
                                onClick={() => selectDisease(disease)}
                            >
                                {disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                )}

                <div className="insights-controls" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="record-selector" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginRight: 'auto' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Select Past Record</label>
                        <select 
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', color: '#000000', minWidth: '200px', fontWeight: '500' }}
                            value={selectedRecordIndex}
                            onChange={(e) => setSelectedRecordIndex(Number(e.target.value))}
                        >
                            {userHistory.map((rec, idx) => (
                                <option key={rec.id} value={idx} style={{ color: '#000000' }}>
                                    {rec.displayDate} (Probability: {rec.probabilityPercent}%)
                                </option>
                            ))}
                        </select>
                    </div>

                    <button 
                        className={`btn-primary ${comparisonGroup === 'high' ? '' : 'btn-outline'}`}
                        onClick={() => setComparisonGroup('high')}
                    >
                        Compare against High-Risk
                    </button>
                    <button 
                        className={`btn-primary ${comparisonGroup === 'low' ? '' : 'btn-outline'}`}
                        style={comparisonGroup === 'low' ? { backgroundColor: '#10b981', color: 'white' } : {}}
                        onClick={() => setComparisonGroup('low')}
                    >
                        Compare against Low-Risk
                    </button>
                </div>

                <div className="analytics-card full-width">
                    <h3>Overall Profile ({selectedRecord.displayDate}) vs. {comparisonGroup === 'high' ? 'High-Risk' : 'Low-Risk'} Averages</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        *For metrics measured on vastly different scales, refer to the Detailed Metrics Breakdown below to see individual comparisons.
                    </p>
                    <div className="chart-container" style={{ height: '400px' }}>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" angle={-45} textAnchor="end" />
                                    <YAxis stroke="var(--text-secondary)" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    />
                                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                                    
                                    <Bar dataKey="YourMetric" fill="#3b82f6" name={`Your Input`} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="AverageMetric" fill={comparisonGroup === 'high' ? '#ef4444' : '#10b981'} name={`${comparisonGroup === 'high' ? 'High-Risk' : 'Low-Risk'} Average`} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                <h4>No comparison data available yet!</h4>
                                <p style={{ maxWidth: '400px', textAlign: 'center' }}>
                                    There aren't enough {comparisonGroup === 'high' ? 'High-Risk' : 'Low-Risk'} patient records for {selectedDisease.replace(/_/g, ' ')} in the community database to establish an average baseline.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {chartData.length > 0 && (
                    <>
                        <div className="full-width" style={{ marginTop: '3rem', marginBottom: '1rem', gridColumn: '1 / -1' }}>
                            <h2 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                Detailed Metrics Breakdown
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                One-by-one comparison for each of your specific health parameters.
                            </p>
                        </div>
                        
                        <div className="analytics-grid">
                            {chartData.map(item => (
                                <div className="analytics-card" key={item.name}>
                                    <h3 style={{ textTransform: 'capitalize' }}>{item.name}</h3>
                                    <div className="chart-container" style={{ height: '220px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[item]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                                <XAxis dataKey="name" hide />
                                                <YAxis stroke="var(--text-secondary)" />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                                    formatter={(value, name) => [typeof value === 'number' ? value.toFixed(2) : value, name === 'YourMetric' ? 'Your Input' : `${comparisonGroup === 'high' ? 'High-Risk' : 'Low-Risk'} Average`]}
                                                />
                                                <Legend />
                                                <Bar dataKey="YourMetric" fill="#3b82f6" name={`Your Input`} radius={[4, 4, 0, 0]} barSize={40} />
                                                <Bar dataKey="AverageMetric" fill={comparisonGroup === 'high' ? '#ef4444' : '#10b981'} name={`${comparisonGroup === 'high' ? 'High-Risk' : 'Low-Risk'} Avg`} radius={[4, 4, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {generateDynamicAISuggestions()}

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

export default Insights;
