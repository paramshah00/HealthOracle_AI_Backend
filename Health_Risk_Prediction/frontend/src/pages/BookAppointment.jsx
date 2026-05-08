import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService, doctorService, appointmentService } from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/index.css';

const DISEASE_DISPLAY = {
    diabetes: 'Diabetes',
    heart_disease: 'Heart Disease',
    hypertension: 'Hypertension',
    kidney_disease: 'Kidney Disease',
};

const BookAppointment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { doctor: preSelectedDoctor, disease: preSelectedDisease, predictionId } = location.state || {};

    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(preSelectedDoctor || null);
    const [disease, setDisease] = useState(preSelectedDisease || '');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    const [showDoctorPicker, setShowDoctorPicker] = useState(!preSelectedDoctor);

    useEffect(() => {
        if (!authService.isAuthenticated()) { navigate('/auth'); return; }
        if (preSelectedDisease && !preSelectedDoctor) {
            loadDoctorsByDisease(preSelectedDisease);
        } else if (!preSelectedDoctor) {
            loadAllDoctors();
        }
    }, []);

    const loadDoctorsByDisease = async (dis) => {
        try {
            const data = await doctorService.getDoctorsByDisease(dis);
            setDoctors(data.doctors || []);
        } catch (err) { console.error(err); }
    };

    const loadAllDoctors = async () => {
        try {
            const data = await doctorService.listDoctors();
            setDoctors(data.doctors || []);
        } catch (err) { console.error(err); }
    };

    const handleDiseaseChange = (dis) => {
        setDisease(dis);
        // Only reset doctor if no doctor is pre-selected from navigation
        // or if user explicitly wants to change
        if (dis && !selectedDoctor) {
            loadDoctorsByDisease(dis);
            setShowDoctorPicker(true);
        } else if (dis) {
            loadDoctorsByDisease(dis);
            // Keep currently selected doctor, don't reset
        }
    };

    const selectDoctor = (doc) => {
        setSelectedDoctor(doc);
        setShowDoctorPicker(false);
    };

    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const handleSubmit = () => {
        if (!disease) {
            setError('Please select a disease concern');
            return;
        }
        if (!selectedDoctor) {
            setError('Please choose a doctor');
            return;
        }
        if (!appointmentDate) {
            setError('Please select an appointment date');
            return;
        }
        setLoading(true);
        setError('');
        appointmentService.bookAppointment({
            doctor_id: selectedDoctor.id,
            disease_name: disease,
            appointment_date: appointmentDate,
            prediction_id: predictionId || null,
            notes: notes || null,
        }).then(result => {
            setSuccess(result);
        }).catch(err => {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to book appointment');
        }).finally(() => {
            setLoading(false);
        });
    };

    // Success state
    if (success) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-main">
                    <div className="booking-success-card">
                        <div className="success-icon-large">✅</div>
                        <h2>Appointment Booked!</h2>
                        <div className="booking-success-details">
                            <div className="success-detail"><span>👨‍⚕️</span> <strong>{success.doctor_name}</strong> ({success.doctor_specialization})</div>
                            <div className="success-detail"><span>🏥</span> {success.doctor_hospital}</div>
                            <div className="success-detail"><span>📅</span> {new Date(appointmentDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                            <div className="success-detail"><span>🕐</span> {success.doctor_time_slot}</div>
                            <div className="success-detail"><span>📋</span> Status: <span className="status-badge status-pending">{success.status}</span></div>
                        </div>
                        <div className="booking-success-actions">
                            <button className="btn-primary" onClick={() => navigate('/appointments')}>
                                View My Appointments
                            </button>
                            <button className="btn-outline" onClick={() => navigate('/predict')}>
                                New Prediction
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>📅 Book <span className="accent-text">Appointment</span></h1>
                    <p>Schedule a consultation with a specialist doctor</p>
                </div>

                <div className="booking-layout">
                    {/* Booking Form */}
                    <div className="booking-form-card">
                        {error && <div className="alert alert-error">{error}</div>}

                        {/* Disease Selection */}
                        <div className="booking-section">
                            <h3>1. Select Disease Concern</h3>
                            <div className="disease-selector">
                                {Object.entries(DISEASE_DISPLAY).map(([key, name]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        className={`disease-chip ${disease === key ? 'active' : ''}`}
                                        onClick={() => handleDiseaseChange(key)}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Doctor Selection */}
                        <div className="booking-section">
                            <h3>2. Choose Doctor</h3>
                            {selectedDoctor && !showDoctorPicker ? (
                                <div className="selected-doctor-card">
                                    <div className="selected-doctor-info">
                                        <div className="doctor-avatar-sm">{selectedDoctor.name.charAt(0)}</div>
                                        <div>
                                            <strong>{selectedDoctor.name}</strong>
                                            <span className="specialization-badge">{selectedDoctor.specialization}</span>
                                            <div className="selected-doctor-meta">
                                                🏥 {selectedDoctor.hospital} • 🕐 {selectedDoctor.time_slot_start} - {selectedDoctor.time_slot_end}
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" className="btn-outline btn-sm" onClick={() => setShowDoctorPicker(true)}>
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div className="doctor-picker-list">
                                    {doctors.length === 0 ? (
                                        <p className="no-doctors-msg">
                                            {disease ? 'No specialists available for this disease.' : 'Select a disease to see available doctors.'}
                                        </p>
                                    ) : (
                                        doctors.map(doc => (
                                            <div
                                                key={doc.id}
                                                className="doctor-picker-item"
                                                onClick={() => selectDoctor(doc)}
                                            >
                                                <div className="doctor-avatar-sm">{doc.name.charAt(0)}</div>
                                                <div className="doctor-picker-info">
                                                    <strong>{doc.name}</strong>
                                                    <small>{doc.specialization} • {doc.hospital}</small>
                                                    <small>🕐 {doc.time_slot_start} - {doc.time_slot_end} • 📅 {doc.available_days}</small>
                                                </div>
                                                <span className="fee-highlight">₹{doc.consultation_fee}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date */}
                        <div className="booking-section">
                            <h3>3. Select Date</h3>
                            {selectedDoctor && (
                                <p className="booking-hint">
                                    Dr. {selectedDoctor.name} is available on <strong>{selectedDoctor.available_days}</strong> from <strong>{selectedDoctor.time_slot_start} - {selectedDoctor.time_slot_end}</strong>
                                </p>
                            )}
                            <input
                                type="date"
                                className="booking-date-input"
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                min={getMinDate()}
                            />
                        </div>

                        {/* Notes */}
                        <div className="booking-section">
                            <h3>4. Notes <span className="optional-tag">(optional)</span></h3>
                            <textarea
                                className="booking-notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Describe your symptoms or concerns..."
                                rows={3}
                            />
                        </div>

                        <button
                            type="button"
                            className="btn-primary booking-submit-btn"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <div className="loader"></div> : 'Confirm Booking →'}
                        </button>
                    </div>

                    {/* Summary Sidebar */}
                    {selectedDoctor && (
                        <div className="booking-summary-card">
                            <h3>Booking Summary</h3>
                            <div className="summary-item"><span>👨‍⚕️</span> <strong>{selectedDoctor.name}</strong></div>
                            <div className="summary-item"><span>🎓</span> {selectedDoctor.qualification}</div>
                            <div className="summary-item"><span>📋</span> {selectedDoctor.specialization}</div>
                            <div className="summary-item"><span>🏥</span> {selectedDoctor.hospital}</div>
                            <div className="summary-item"><span>📍</span> {selectedDoctor.location}</div>
                            <div className="summary-item"><span>🕐</span> {selectedDoctor.time_slot_start} - {selectedDoctor.time_slot_end}</div>
                            <div className="summary-item"><span>📅</span> {selectedDoctor.available_days}</div>
                            <div className="summary-divider"></div>
                            <div className="summary-item summary-disease"><span>🩺</span> {DISEASE_DISPLAY[disease] || disease || 'Not selected'}</div>
                            <div className="summary-item"><span>📆</span> {appointmentDate ? new Date(appointmentDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Not selected'}</div>
                            <div className="summary-divider"></div>
                            <div className="summary-fee">
                                <span>Consultation Fee</span>
                                <strong>₹{selectedDoctor.consultation_fee}</strong>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BookAppointment;
