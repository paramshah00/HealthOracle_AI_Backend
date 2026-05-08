import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/index.css';

const features = [
    { icon: '🧬', title: 'Disease Risk Prediction', desc: 'Enter your health parameters and get a risk score for conditions like diabetes and heart disease, backed by clinically trained ML models.' },
    { icon: '📊', title: 'Your Health Over Time', desc: 'Every prediction you make gets logged. Come back a month later and see whether those numbers are moving in the right direction.' },
    { icon: '📈', title: 'Population-Level Trends', desc: 'See how risk factors are distributed across anonymized datasets — useful context when interpreting your own numbers.' },
    { icon: '🤖', title: 'AI Health Assistant', desc: 'Ask the assistant to explain a result, suggest a diet plan, or walk through what a specific metric actually means for you.' },
    { icon: '👨‍⚕️', title: 'Doctor Consultation', desc: 'Review doctors and book an appointment in a particular time slot if medical attention is required.' },
];

const stats = [
    { value: 'Daily', label: 'Health Insights' },
    { value: 'ML', label: 'Trained Models' },
    { value: '100%', label: 'Data Private' },
    { value: 'Free', label: 'No Hidden Costs' },
];

const ECGLine = () => (
    <svg
        viewBox="0 0 1200 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{
            position: 'absolute',
            bottom: '10%',
            left: 0,
            right: 0,
            width: '100%',
            opacity: 0.15,
            pointerEvents: 'none',
        }}
        preserveAspectRatio="none"
    >
        <path
            d="M0,40 L200,40 L220,40 L230,10 L240,70 L250,5 L260,75 L270,40 L400,40 L420,40 L430,10 L440,70 L450,5 L460,75 L470,40 L700,40 L720,40 L730,10 L740,70 L750,5 L760,75 L770,40 L1000,40 L1020,40 L1030,10 L1040,70 L1050,5 L1060,75 L1070,40 L1200,40"
            stroke="url(#ecgGradient)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="2000"
            strokeDashoffset="2000"
            style={{ animation: 'drawEcg 4s linear infinite' }}
        />
        <defs>
            <linearGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="transparent" />
            </linearGradient>
        </defs>
    </svg>
);

const Home = () => {
    const heroRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const cards = document.querySelectorAll('.feature-card');
        cards.forEach((card, i) => {
            card.style.animationDelay = `${0.1 + i * 0.1}s`;
            card.classList.add('fade-in-card');
        });
    }, []);

    const handleMouseMove = (e) => {
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes drawEcg {
                    0%   { stroke-dashoffset: 2000; }
                    100% { stroke-dashoffset: 0; }
                }
                .fade-in-card {
                    opacity: 0;
                    animation: fadeInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
                }
                .cursor-glow {
                    position: absolute;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    transition: transform 0.1s ease-out;
                    z-index: 0;
                }
                .hero {
                    position: relative;
                    overflow: hidden;
                }
                .hero-content {
                    position: relative;
                    z-index: 1;
                }
                .stat-pulse {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 1.2rem 1.8rem;
                    border-radius: 20px;
                    background: rgba(19, 27, 46, 0.5);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-top: 1px solid rgba(255,255,255,0.15);
                    flex: 1;
                    min-width: 0;
                    transition: all 0.3s ease;
                    cursor: default;
                }
                .stat-pulse:hover {
                    transform: translateY(-5px);
                    background: rgba(19, 27, 46, 0.8);
                    border-color: rgba(20, 184, 166, 0.35);
                    box-shadow: 0 10px 30px rgba(20, 184, 166, 0.12);
                }
                .stat-pulse-val {
                    font-family: 'Outfit', sans-serif;
                    font-size: 1.8rem;
                    font-weight: 800;
                    letter-spacing: -0.04em;
                    background: linear-gradient(135deg, #14B8A6, #38BDF8);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    white-space: nowrap;
                }
                .stat-pulse-label {
                    font-size: 0.75rem;
                    color: #CBD5E1;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    white-space: nowrap;
                }
                .how-it-works { padding: 6rem 2rem; max-width: 1000px; margin: 0 auto; }
                .how-it-works h2 {
                    font-family: 'Outfit', sans-serif; font-size: 2.5rem; font-weight: 800;
                    letter-spacing: -0.04em; text-align: center; margin-bottom: 0.8rem;
                }
                .how-it-works .sub {
                    text-align: center; color: #CBD5E1; font-size: 1.05rem; margin-bottom: 4rem; line-height: 1.6;
                }
                .steps { display: flex; gap: 0; position: relative; }
                .steps::before {
                    content: ''; position: absolute; top: 32px; left: 10%; right: 10%; height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(20,184,166,0.4), rgba(56,189,248,0.4), transparent);
                }
                .step {
                    flex: 1; display: flex; flex-direction: column; align-items: center;
                    text-align: center; padding: 0 1rem; gap: 1rem; transition: all 0.3s ease;
                }
                .step:hover { transform: translateY(-10px); }
                .step:hover .step-dot {
                    background: #14B8A6; color: #0C1222; border-color: #14B8A6;
                    box-shadow: 0 0 20px rgba(20,184,166,0.4);
                }
                .step-dot {
                    width: 64px; height: 64px; border-radius: 50%;
                    background: rgba(19, 27, 46, 0.9); border: 2px solid rgba(20, 184, 166, 0.35);
                    display: flex; align-items: center; justify-content: center; font-size: 1.6rem;
                    position: relative; z-index: 1; flex-shrink: 0; transition: all 0.3s ease;
                }
                .step-num {
                    position: absolute; top: -6px; right: -6px; width: 22px; height: 22px; border-radius: 50%;
                    background: #f8fafc; color: #030712; font-size: 0.75rem; font-weight: 800;
                    display: flex; align-items: center; justify-content: center; font-family: 'Outfit', sans-serif;
                }
                .step h4 { font-family: 'Outfit', sans-serif; font-size: 1.05rem; font-weight: 700; color: #F1F5F9; }
                .step p { font-size: 0.85rem; color: #CBD5E1; line-height: 1.6; }
                
                .interactive-cta {
                    background: rgba(19, 27, 46, 0.65);
                    backdrop-filter: blur(24px);
                    border: 1px solid rgba(20, 184, 166, 0.25);
                    border-top: 1px solid rgba(255,255,255,0.15);
                    border-radius: 32px;
                    padding: 4rem 3rem;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.5s ease;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                }
                .interactive-cta:hover {
                    border-color: #14B8A6;
                    box-shadow: 0 30px 60px rgba(20, 184, 166, 0.15);
                    transform: translateY(-5px);
                }
            `}</style>

            <nav className="navbar">
                <Link to="/" className="navbar-logo">
                    🩺 <span>HealthOracle AI</span>
                </Link>
                <div className="navbar-links">
                    <a href="#features">Features</a>
                    <a href="#how-it-works">How it works</a>
                    <Link to="/doctor/auth" className="navbar-btn" style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38BDF8' }}>Doctor Portal →</Link>
                    <Link to="/auth" className="navbar-btn">Sign in →</Link>
                </div>
            </nav>

            <section className="hero" ref={heroRef} onMouseMove={handleMouseMove}>
                <div 
                    className="cursor-glow" 
                    style={{ left: mousePos.x, top: mousePos.y }}
                />
                <ECGLine />
                <div className="hero-content">
                    <div className="hero-badge">✦ ML-Powered Health Risk Assessment</div>
                    <h1>
                        Your health numbers.<br />
                        <em>Actually explained.</em>
                    </h1>
                    <p>
                        Most people get lab results and have no idea what they mean.
                        HealthOracle AI runs your numbers through trained ML models and
                        tells you your actual risk — not a generic disclaimer, but a
                        personalized score with context you can act on.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/auth"><button className="btn-primary">Get started — it's free</button></Link>
                        <a href="#features"><button className="btn-outline">See what's included</button></a>
                    </div>
                    <div className="hero-trust" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '4rem', flexWrap: 'nowrap', width: '100%', maxWidth: '800px', margin: '4rem auto 0' }}>
                        {stats.map((s, i) => (
                            <div className="stat-pulse" key={i}>
                                <span className="stat-pulse-val">{s.value}</span>
                                <span className="stat-pulse-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="how-it-works" id="how-it-works">
                <h2>How it works</h2>
                <p className="sub">Five steps. Takes under two minutes.</p>
                <div className="steps">
                    {[
                        { icon: '📝', n: '1', title: 'Enter your data', desc: 'Blood glucose, BMI, cholesterol — whatever you have from your last checkup.' },
                        { icon: '⚡', n: '2', title: 'Get your score', desc: 'Our models return a risk probability and a risk level within seconds.' },
                        { icon: '📋', n: '3', title: 'Read the guidance', desc: 'Specific recommendations based on your result — not generic advice.' },
                        { icon: '🤖', n: '4', title: 'Ask the AI', desc: 'Still confused? The AI assistant can explain anything in plain language.' },
                        { icon: '📅', n: '5', title: 'Consult a Doctor', desc: 'View our doctors list and book an appointment in your preferred time slot.' },
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

            <section className="features" id="features">
                <div className="features-header">
                    <h2>What's inside</h2>
                    <p>Built around the idea that early information is better than late diagnosis. Here's what you get.</p>
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

            <section style={{ padding: '6rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                <div className="interactive-cta">
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(20,184,166,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1.2rem', color: '#F1F5F9' }}>
                        Know before you need to.
                    </h2>
                    <p style={{ color: '#CBD5E1', marginBottom: '2.5rem', lineHeight: 1.8, fontSize: '1.05rem', padding: '0 2rem' }}>
                        Risk doesn't announce itself. Getting a baseline now — while numbers are still normal — is the only way to catch a shift early enough to do something about it.
                    </p>
                    <Link to="/auth">
                        <button className="btn-primary" style={{ fontSize: '1.05rem', padding: '1rem 2.8rem' }}>
                            Create your free account →
                        </button>
                    </Link>
                </div>
            </section>

            <footer className="footer">
                <div>© 2026 HealthOracle AI. Not a substitute for medical advice.</div>
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

