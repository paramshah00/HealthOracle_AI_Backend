import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, appointmentService } from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/index.css';

const STATUS_CONFIG = {
    pending: { label: 'Pending', class: 'status-pending', icon: '⏳' },
    confirmed: { label: 'Confirmed', class: 'status-confirmed', icon: '✅' },
    completed: { label: 'Completed', class: 'status-completed', icon: '✔️' },
    cancelled: { label: 'Cancelled', class: 'status-cancelled', icon: '❌' },
};

const Appointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [cancelling, setCancelling] = useState(null);

    useEffect(() => {
        if (!authService.isAuthenticated()) { navigate('/auth'); return; }
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        setLoading(true);
        try {
            const data = await appointmentService.getMyAppointments();
            setAppointments(data.appointments || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        setCancelling(id);
        try {
            await appointmentService.cancelAppointment(id);
            loadAppointments();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to cancel');
        } finally {
            setCancelling(null);
        }
    };

    const filtered = filter === 'all'
        ? appointments
        : appointments.filter(a => a.status === filter);

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>📅 My <span className="accent-text">Appointments</span></h1>
                    <p>Track and manage your doctor consultations</p>
                </div>

                {/* Status Filter */}
                <div className="appointment-filters">
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
                        <button
                            key={f}
                            className={`disease-chip ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label}
                            {f !== 'all' && (
                                <span className="filter-count">
                                    {appointments.filter(a => a.status === f).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Appointments */}
                {loading ? (
                    <div className="admin-loading">
                        <div className="loader"></div>
                        <p>Loading appointments...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📅</span>
                        <h3>{filter === 'all' ? 'No appointments yet' : `No ${filter} appointments`}</h3>
                        <p>Book an appointment with a specialist doctor.</p>
                        <button className="btn-primary" onClick={() => navigate('/doctors')}>
                            Find Doctors →
                        </button>
                    </div>
                ) : (
                    <div className="appointments-list">
                        {filtered.map(appt => {
                            const config = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                            return (
                                <div key={appt.id} className={`appointment-card ${appt.status === 'cancelled' ? 'appointment-cancelled' : ''}`}>
                                    <div className="appointment-card-top">
                                        <div className="appointment-doctor-info">
                                            <div className="doctor-avatar-sm">
                                                {appt.doctor_name?.charAt(0) || 'D'}
                                            </div>
                                            <div>
                                                <h3>{appt.doctor_name}</h3>
                                                <span className="specialization-badge">{appt.doctor_specialization}</span>
                                            </div>
                                        </div>
                                        <span className={`status-badge ${config.class}`}>
                                            {config.icon} {config.label}
                                        </span>
                                    </div>

                                    <div className="appointment-card-details">
                                        <div className="appt-detail"><span>🏥</span> {appt.doctor_hospital}</div>
                                        <div className="appt-detail"><span>🩺</span> {appt.disease_name.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                                        <div className="appt-detail"><span>📅</span> {new Date(appt.appointment_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                        <div className="appt-detail"><span>🕐</span> {appt.doctor_time_slot}</div>
                                        {appt.notes && <div className="appt-detail appt-notes"><span>📝</span> {appt.notes}</div>}
                                    </div>

                                    {(appt.status === 'pending' || appt.status === 'confirmed') && (
                                        <div className="appointment-card-actions">
                                            <button
                                                className="btn-outline btn-danger-outline"
                                                onClick={() => handleCancel(appt.id)}
                                                disabled={cancelling === appt.id}
                                            >
                                                {cancelling === appt.id ? 'Cancelling...' : 'Cancel Appointment'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Appointments;
