import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, predictionService } from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/index.css';

const PredictionForm = () => {
    const navigate = useNavigate();
    const user = authService.getUser();
    const [diseases, setDiseases] = useState([]);
    const [selectedDisease, setSelectedDisease] = useState('');
    const [features, setFeatures] = useState([]);
    const [formValues, setFormValues] = useState({});
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (!authService.isAuthenticated()) { navigate('/auth'); return; }
        loadDiseases();
    }, []);

    const loadDiseases = async () => {
        try {
            const list = await predictionService.getDiseases();
            setDiseases(list.filter(d => d.available));
            if (list.length > 0) {
                const first = list.find(d => d.available);
                if (first) selectDisease(first.key);
            }
        } catch (err) {
            setError('Failed to load diseases');
        }
    };

    const selectDisease = async (diseaseKey) => {
        setSelectedDisease(diseaseKey);
        setResult(null);
        setError('');
        setFieldErrors({});
        try {
            const data = await predictionService.getFeatures(diseaseKey);
            setFeatures(data.features);
            const defaults = {};
            data.features.forEach(f => { defaults[f.name] = ''; });
            setFormValues(defaults);
        } catch (err) {
            setError('Failed to load form fields');
        }
    };

    const handleChange = (name, value) => {
        setFormValues(prev => ({ ...prev, [name]: value }));
        
        const f = features.find(feat => feat.name === name);
        if (f && value !== '') {
            const numVal = parseFloat(value);
            if (!isNaN(numVal)) {
                if (f.min !== undefined && numVal < f.min) {
                    setFieldErrors(prev => ({ ...prev, [name]: `Must be between ${f.min} and ${f.max}` }));
                } else if (f.max !== undefined && numVal > f.max) {
                    setFieldErrors(prev => ({ ...prev, [name]: `Must be between ${f.min} and ${f.max}` }));
                } else {
                    setFieldErrors(prev => { const newErrs = { ...prev }; delete newErrs[name]; return newErrs; });
                }
            }
        } else {
            setFieldErrors(prev => { const newErrs = { ...prev }; delete newErrs[name]; return newErrs; });
        }
    };

    const isFormValid = () => {
        if (Object.keys(fieldErrors).length > 0) return false;
        
        return features.every(f => {
            if (f.name === 'Pregnancies' && user?.gender?.toLowerCase() === 'male') return true;
            return formValues[f.name] !== '' && formValues[f.name] !== undefined;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const payloadData = {};
            for (const f of features) {
                if (f.name === 'Pregnancies' && user?.gender?.toLowerCase() === 'male') {
                    payloadData[f.name] = 0;
                    continue;
                }
                
                if (f.options && f.options.length > 0) {
                    // Check if it's an object or string
                    const rawValue = formValues[f.name];
                    if (rawValue === undefined || rawValue === '') {
                        setError(`Missing value for ${f.label}`);
                        setLoading(false);
                        return;
                    }

                    // Numeric categorical features (e.g. sex = 0/1) should still be casted to float
                    // if the feature type is explicitly set as float/int
                    if (f.type === 'float' || f.type === 'int') {
                        payloadData[f.name] = parseFloat(rawValue);
                        if (isNaN(payloadData[f.name])) {
                            setError(`Invalid numeric value for ${f.label}`);
                            setLoading(false);
                            return;
                        }
                    } else {
                        // String categorical features
                        payloadData[f.name] = rawValue;
                    }
                } else {
                    // Numeric features
                    payloadData[f.name] = parseFloat(formValues[f.name]);
                    if (isNaN(payloadData[f.name])) {
                        setError(`Invalid value for ${f.label}`);
                        setLoading(false);
                        return;
                    }
                }
            }
            const res = await predictionService.predict(selectedDisease, payloadData);
            setResult(res);
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Prediction failed. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    const getUrgencyClass = (urgency) => {
        if (urgency === 'urgent') return 'urgency-urgent';
        if (urgency === 'high') return 'urgency-high';
        if (urgency === 'moderate') return 'urgency-moderate';
        return 'urgency-low';
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
                    <h1>🧬 Disease Risk <span className="accent-text">Prediction</span></h1>
                    <p>Select a disease and enter your health parameters</p>
                </div>

                {/* Disease Selector */}
                {diseases.length > 0 && (
                    <div className="disease-selector">
                        {diseases.map(d => (
                            <button
                                key={d.key}
                                className={`disease-chip ${selectedDisease === d.key ? 'active' : ''}`}
                                onClick={() => selectDisease(d.key)}
                            >
                                {d.display_name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="prediction-layout">
                    {/* ─── INPUT FORM ─── */}
                    <div className="prediction-form-card">
                        <h3>Enter Health Parameters</h3>
                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="prediction-fields-grid">
                                {features.map(f => {
                                    if (f.name === 'Pregnancies' && user?.gender?.toLowerCase() === 'male') return null;
                                    return (
                                        <div className="prediction-field" key={f.name}>
                                            <label>{f.label} {f.unit && <span className="field-unit">({f.unit})</span>}</label>
                                            
                                            {f.options && f.options.length > 0 ? (
                                                <select
                                                    value={formValues[f.name] || ''}
                                                    onChange={(e) => handleChange(f.name, e.target.value)}
                                                    required
                                                    className="prediction-select"
                                                >
                                                    <option value="" disabled>Select {f.label}</option>
                                                    {f.options.map((opt, i) => {
                                                        const isObj = typeof opt === 'object';
                                                        return (
                                                            <option key={i} value={isObj ? opt.value : opt}>
                                                                {isObj ? opt.label : opt}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            ) : (
                                                <input
                                                    type="number"
                                                    step={f.type === 'float' ? 'any' : '1'}
                                                    min={f.min}
                                                    max={f.max}
                                                    value={formValues[f.name] || ''}
                                                    onChange={(e) => handleChange(f.name, e.target.value)}
                                                    placeholder={f.hint}
                                                    required
                                                />
                                            )}

                                            {fieldErrors[f.name] && <div className="field-warning" style={{ marginTop: '0.3rem' }}>{fieldErrors[f.name]}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                type="submit"
                                className="btn-primary predict-btn"
                                disabled={loading || !isFormValid()}
                            >
                                {loading ? <div className="loader"></div> : 'Analyze Risk →'}
                            </button>
                        </form>
                    </div>

                    {/* ─── RESULT CARD ─── */}
                    {result && (
                        <div className="result-card">
                            <div className="result-header">
                                <h3>Prediction Result</h3>
                                <span className={`risk-badge ${getRiskClass(result.risk_level)}`}>{result.risk_level} Risk</span>
                            </div>

                            <div className="result-label-row">
                                <div className={`result-prediction ${result.prediction === 1 ? 'positive' : 'negative'}`}>
                                    {result.label}
                                </div>
                            </div>

                            {/* Probability Gauge */}
                            <div className="probability-section">
                                <div className="probability-label">
                                    <span>Probability</span>
                                    <span className="probability-value">{(result.probability * 100).toFixed(1)}%</span>
                                </div>
                                <div className="probability-bar-track">
                                    <div
                                        className={`probability-bar-fill ${getRiskClass(result.risk_level)}`}
                                        style={{ width: `${result.probability * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Health Guidance */}
                            <div className={`guidance-box ${getUrgencyClass(result.guidance?.urgency)}`}>
                                <p className="guidance-summary">{result.guidance?.summary}</p>
                                <ul className="guidance-list">
                                    {result.guidance?.recommendations?.map((rec, i) => (
                                        <li key={i}>{rec}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* AI Chat CTA */}
                            {result.guidance?.show_ai_chat && (
                                <div className="ai-chat-cta">
                                    <span>🤖</span>
                                    <div>
                                        <strong>Need more guidance?</strong>
                                        <p>Chat with our AI Health Assistant for personalized advice</p>
                                    </div>
                                    <button className="btn-primary btn-sm" onClick={() => navigate('/ai-chat', { state: { predictionId: result.id } })}>
                                        Chat with AI →
                                    </button>
                                </div>
                            )}

                            {/* Doctor Consultation CTA — shown for High/Critical risk */}
                            {(result.risk_level === 'Critical' || result.risk_level === 'High') && (
                                <div className="doctor-consult-cta">
                                    <span>👨‍⚕️</span>
                                    <div>
                                        <strong>Consult a Specialist</strong>
                                        <p>Your risk level is elevated — book an appointment with a specialist doctor for expert guidance</p>
                                    </div>
                                    <button className="btn-primary btn-sm" onClick={() => navigate('/book-appointment', { state: { disease: selectedDisease, predictionId: result.id } })}>
                                        Book Appointment →
                                    </button>
                                </div>
                            )}

                            <div className="result-actions">
                                <button className="btn-outline" onClick={() => { setResult(null); setFormValues({}); }}>
                                    New Prediction
                                </button>
                                <Link to="/history"><button className="btn-primary btn-sm">View History</button></Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PredictionForm;
