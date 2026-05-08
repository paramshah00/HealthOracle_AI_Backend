import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Auth from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PredictionForm from './pages/PredictionForm.jsx'
import { HistoryList, HistoryDetail } from './pages/History.jsx'
import Analytics from './pages/Analytics.jsx'

import AIChat from './pages/AIChat.jsx'
import Doctors from './pages/Doctors.jsx'
import Appointments from './pages/Appointments.jsx'
import BookAppointment from './pages/BookAppointment.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

import DoctorAuth from './pages/DoctorAuth.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'

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

                <Route path="/ai-chat" element={<AIChat />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/book-appointment" element={<BookAppointment />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />

                {/* Doctor Portal */}
                <Route path="/doctor/auth" element={<DoctorAuth />} />
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            </Routes>
        </Router>
    )
}

export default App

