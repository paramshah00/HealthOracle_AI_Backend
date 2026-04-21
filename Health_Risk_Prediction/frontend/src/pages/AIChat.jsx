import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { authService, assistantService } from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/index.css';

const QUICK_ACTIONS = [
    { label: '🔍 Break down my last result', prompt: 'Explain my latest prediction results clearly. What does the risk level mean in practice?' },
    { label: '🥗 Diet suggestions', prompt: 'Based on my health data, suggest a realistic daily diet that could help lower my disease risk.' },
    { label: '💪 What should I work on first?', prompt: 'Looking at my health metrics, which areas need the most attention? Give me specific steps, not general advice.' },
    { label: '📊 How am I trending?', prompt: 'Look at my prediction history. Am I improving, getting worse, or stuck? Be honest.' },
];

const AIChat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const predictionId = location.state?.predictionId;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const hasInitialized = useRef(false);

    const sendMessage = async (text, hideContent = false) => {
        if (!text.trim() || loading) return;

        if (!hideContent) {
            setMessages(prev => [...prev, { role: 'user', content: text.trim() }]);
        }
        setInput('');
        setLoading(true);

        try {
            const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
            const res = await assistantService.chat(text.trim(), predictionId, historyPayload);
            setMessages(prev => [...prev, { role: 'ai', content: res.response, disclaimer: res.disclaimer }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'ai',
                content: '❌ Something went wrong. Check that your GROQ_API_KEY is set in the .env file and the backend is running.'
            }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    useEffect(() => {
        if (!authService.isAuthenticated()) { navigate('/auth'); return; }
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const currentUser = authService.getUser()?.email || 'guest';
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `healthpredict_chat_${currentUser}`;

        let initialMessages = [];
        try {
            const cached = JSON.parse(localStorage.getItem(storageKey));
            if (cached && cached.date === today && Array.isArray(cached.messages) && cached.messages.length > 0) {
                initialMessages = cached.messages;
                setMessages(initialMessages);
            } else {
                localStorage.removeItem(storageKey);
            }
        } catch (e) {}

        if (predictionId) {
            const autoPrompt = "Please break down this prediction result. Explain the key risk factors based on my metrics, and give me a clear action plan.";
            const userBubble = { role: 'user', content: "📊 Break down this prediction and give me an action plan." };
            setMessages(initialMessages.length > 0 ? [...initialMessages, userBubble] : [userBubble]);
            setTimeout(() => { sendMessage(autoPrompt, true); }, 100);
        } else if (initialMessages.length === 0) {
            setMessages([{
                role: 'ai',
                content: "👋 I'm your health assistant. I have access to your prediction history and can help you understand your results, suggest diet changes, and flag things worth discussing with your doctor.\n\nTry one of the quick questions below, or just ask me something directly.",
            }]);
        }
    }, [predictionId, navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        const currentUser = authService.getUser()?.email || 'guest';
        if (messages.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`healthpredict_chat_${currentUser}`, JSON.stringify({
                date: today,
                messages: messages
            }));
        }
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>

                {/* Header */}
                <div className="chat-header">
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                            🤖 Health <span className="accent-text">Assistant</span>
                        </h1>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Powered by Llama 3 · Has access to your prediction history
                        </p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="chat-disclaimer">
                    ⚕️ AI assistant only — not a replacement for medical advice. Talk to your doctor about anything serious.
                </div>

                {/* Messages */}
                <div className="chat-messages">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`chat-bubble ${msg.role === 'user' ? 'chat-user' : 'chat-ai'}`}>
                            {msg.role === 'ai' && <div className="chat-avatar">🤖</div>}
                            <div className="chat-content">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                            {msg.role === 'user' && <div className="chat-avatar chat-avatar-user">You</div>}
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-bubble chat-ai">
                            <div className="chat-avatar">🤖</div>
                            <div className="chat-content">
                                <div className="chat-typing">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {messages.length <= 1 && !loading && (
                    <div className="chat-quick-actions">
                        {QUICK_ACTIONS.map((action, idx) => (
                            <button key={idx} className="chat-quick-btn" onClick={() => sendMessage(action.prompt)}>
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <form className="chat-input-bar" onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your results, diet, what to watch out for..."
                        disabled={loading}
                        className="chat-input"
                    />
                    <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()}>
                        {loading ? '⏳' : '➤'}
                    </button>
                </form>
            </main>
        </div>
    );
};

export default AIChat;
