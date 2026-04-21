import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/index.css';

const features = [
    {
        icon: '🧬',
        title: 'Disease Risk Prediction',
        desc: 'Enter your health parameters and get a risk score for conditions like diabetes and heart disease, backed by clinically trained ML models.',
    },
    {
        icon: '📊',
        title: 'Your Health Over Time',
        desc: 'Every prediction you make gets logged. Come back a month later and see whether those numbers are moving in the right direction.',
    },
    {
        icon: '📈',
        title: 'Population-Level Trends',
        desc: 'See how risk factors are distributed across anonymized datasets — useful context when interpreting your own numbers.',
    },
    {
        icon: '🤖',
        title: 'AI Health Assistant',
        desc: 'Ask the assistant to explain a result, suggest a diet plan, or walk through what a specific metric actually means for you.',
    },
];

const stats = [
    { value: '7+', label: 'Diseases Screened' },
    { value: 'ML', label: 'Trained Models' },
    { value: '100%', label: 'Data Private' },
    { value: 'Free', label: 'No Hidden Costs' },
];

// Minimal animated ECG-style line for the hero background
const ECGLine = () => (
    <svg
        viewBox="0 0 1200 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{
            position: 'absolute',
            bottom: '12%',
            left: 0,
            right: 0,
            width: '100%',
            opacity: 0.07,
            pointerEvents: 'none',
        }}
        preserveAspectRatio="none"
    >
        <path
            d="M0,40 L200,40 L220,40 L230,10 L240,70 L250,5 L260,75 L270,40 L400,40 L420,40 L430,10 L440,70 L450,5 L460,75 L470,40 L700,40 L720,40 L730,10 L740,70 L750,5 L760,75 L770,40 L1000,40 L1020,40 L1030,10 L1040,70 L1050,5 L1060,75 L1070,40 L1200,40"
            stroke="#00c896"
            strokeWidth="2"
            fill="none"
        />
    </svg>
);

const Home = () => {
    const heroRef = useRef(null);

    useEffect(() => {
        // Staggered animation on load
        const cards = document.querySelectorAll('.feature-card');
        cards.forEach((card, i) => {
            card.style.animationDelay = `${0.1 + i * 0.08}s`;
            card.classList.add('fade-in-card');
        });
    }, []);

    return (
        <>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .fade-in-card {
                    opacity: 0;
                    animation: fadeInUp 0.5s ease both;
                }
                .stat-pulse {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.3rem;
                    padding: 1.4rem 2rem;
                    border-radius: 16px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.07);
                    min-width: 110px;
                }
                .stat-pulse-val {
                    font-family: 'Syne', sans-serif;
                    font-size: 1.9rem;
                    font-weight: 800;
                    letter-spacing: -0.04em;
                    background: linear-gradient(135deg, #00c896, #4f8ef7);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .stat-pulse-label {
                    font-size: 0.75rem;
                    color: #5a6a85;
                    font-weight: 500;
                    letter-spacing: 0.03em;
                }
                .how-it-works {
                    padding: 5rem 2rem;
                    max-width: 900px;
                    margin: 0 auto;
                }
                .how-it-works h2 {
                    font-family: 'Syne', sans-serif;
                    font-size: 2rem;
                    font-weight: 700;
                    letter-spacing: -0.04em;
                    text-align: center;
                    margin-bottom: 0.6rem;
                }
                .how-it-works .sub {
                    text-align: center;
                    color: #94a3c0;
                    font-size: 0.95rem;
                    margin-bottom: 3rem;
                    line-height: 1.6;
                }
                .steps {
                    display: flex;
                    gap: 0;
                    position: relative;
                }
                .steps::before {
                    content: '';
                    position: absolute;
                    top: 28px;
                    left: calc(12.5% + 20px);
                    right: calc(12.5% + 20px);
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(0,200,150,0.3), rgba(79,142,247,0.3), transparent);
                }
                .step {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding: 0 1rem;
                    gap: 0.9rem;
                }
                .step-dot {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: rgba(13, 21, 40, 0.9);
                    border: 2px solid rgba(0, 200, 150, 0.35);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.4rem;
                    position: relative;
                    z-index: 1;
                    flex-shrink: 0;
                }
                .step-num {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #00c896;
                    color: #041010;
                    font-size: 0.65rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Syne', sans-serif;
                }
                .step h4 {
                    font-family: 'Syne', sans-serif;
                    font-size: 0.9rem;
                    font-weight: 600;
                    letter-spacing: -0.02em;
                    color: #eef2ff;
                }
                .step p {
                    font-size: 0.8rem;
                    color: #94a3c0;
                    line-height: 1.6;
                }
                @media (max-width: 600px) {
                    .steps { flex-direction: column; gap: 1.5rem; }
                    .steps::before { display: none; }
                    .stat-pulse { min-width: 80px; padding: 1rem; }
                }
            `}</style>

            {/* ─── NAVBAR ─── */}
            <nav className="navbar">
                <Link to="/" className="navbar-logo">
                    🩺 <span>HealthPredict</span>
                </Link>
                <div className="navbar-links">
                    <a href="#features">Features</a>
                    <a href="#how-it-works">How it works</a>
                    <Link to="/auth" className="navbar-btn">Sign in →</Link>
                </div>
            </nav>

            {/* ─── HERO ─── */}
            <section className="hero" ref={heroRef}>
                <ECGLine />
                <div className="hero-content">
                    <div className="hero-badge">
                        ✦ ML-Powered Health Risk Assessment
                    </div>

                    <h1>
                        Your health numbers.<br />
                        <em>Actually explained.</em>
                    </h1>

                    <p>
                        Most people get lab results and have no idea what they mean.
                        HealthPredict runs your numbers through trained ML models and
                        tells you your actual risk — not a generic disclaimer, but a
                        personalized score with context you can act on.
                    </p>

                    <div className="hero-buttons">
                        <Link to="/auth">
                            <button className="btn-primary">Get started — it's free</button>
                        </Link>
                        <a href="#features">
                            <button className="btn-outline">See what's included</button>
                        </a>
                    </div>

                    {/* Stats row */}
                    <div className="hero-trust" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                        {stats.map((s, i) => (
                            <div className="stat-pulse" key={i}>
                                <span className="stat-pulse-val">{s.value}</span>
                                <span className="stat-pulse-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section className="how-it-works" id="how-it-works">
                <h2>How it works</h2>
                <p className="sub">Three steps. Takes under two minutes.</p>

                <div className="steps">
                    {[
                        { icon: '📝', n: '1', title: 'Enter your data', desc: 'Blood glucose, BMI, cholesterol — whatever you have from your last checkup.' },
                        { icon: '⚡', n: '2', title: 'Get your score', desc: 'Our models return a risk probability and a risk level within seconds.' },
                        { icon: '📋', n: '3', title: 'Read the guidance', desc: 'Specific recommendations based on your result — not generic advice.' },
                        { icon: '🤖', n: '4', title: 'Ask the AI', desc: 'Still confused? The AI assistant can explain anything in plain language.' },
                    ].map((step, i) => (
                        <div className="step" key={i}>
                            <div className="step-dot">
                                {step.icon}
                                <span className="step-num">{step.n}</span>
                            </div>
                            <h4>{step.title}</h4>
                            <p>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── FEATURES ─── */}
            <section className="features" id="features">
                <div className="features-header">
                    <h2>What's inside</h2>
                    <p>
                        Built around the idea that early information is better than
                        late diagnosis. Here's what you get.
                    </p>
                </div>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <div className="feature-card" key={i}>
                            <div className="feature-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── CTA BANNER ─── */}
            <section style={{
                padding: '4rem 2rem',
                maxWidth: '700px',
                margin: '0 auto',
                textAlign: 'center',
            }}>
                <div style={{
                    background: 'rgba(13, 21, 40, 0.8)',
                    border: '1px solid rgba(0, 200, 150, 0.2)',
                    borderRadius: '24px',
                    padding: '3rem 2.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 50% 0%, rgba(0,200,150,0.08) 0%, transparent 60%)',
                        pointerEvents: 'none',
                    }} />
                    <h2 style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: '2rem',
                        fontWeight: 700,
                        letterSpacing: '-0.04em',
                        marginBottom: '1rem',
                        color: '#eef2ff',
                    }}>
                        Know before you need to.
                    </h2>
                    <p style={{ color: '#94a3c0', marginBottom: '2rem', lineHeight: 1.7, fontSize: '0.95rem' }}>
                        Risk doesn't announce itself. Getting a baseline now — while
                        numbers are still normal — is the only way to catch a shift
                        early enough to do something about it.
                    </p>
                    <Link to="/auth">
                        <button className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.2rem' }}>
                            Create your free account →
                        </button>
                    </Link>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="footer">
                <div>© 2026 HealthPredict. Not a substitute for medical advice.</div>
                <div className="footer-links">
                    <Link to="/auth">Login</Link>
                    <Link to="/auth">Register</Link>
                    <a href="#features">Features</a>
                </div>
            </footer>
        </>
    );
};

export default Home;
