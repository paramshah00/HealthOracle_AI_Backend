import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Auth from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PredictionForm from './pages/PredictionForm.jsx'
import { HistoryList, HistoryDetail } from './pages/History.jsx'
import Analytics from './pages/Analytics.jsx'
import Insights from './pages/Insights.jsx'
import AIChat from './pages/AIChat.jsx'

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/predict" element={<PredictionForm />} />
                <Route path="/history" element={<HistoryList />} />
                <Route path="/history/:id" element={<HistoryDetail />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/ai-chat" element={<AIChat />} />
            </Routes>
        </Router>
    )
}

export default App
