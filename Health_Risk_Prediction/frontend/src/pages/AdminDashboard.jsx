import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, doctorService } from '../services/api';
import '../styles/index.css';

const DAYS_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_OPTIONS = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
];

const SPECIALIZATIONS = [
    'Cardiologist', 'Endocrinologist', 'Diabetologist', 'Nephrologist',
    'Neurologist', 'Urologist', 'General Physician', 'Pulmonologist',
    'Gastroenterologist', 'Dermatologist', 'Orthopedist', 'Psychiatrist',
];

const emptyForm = {
    name: '', specialization: '', qualification: '', experience_years: '',
    hospital: '', location: '', phone: '', email: '', consultation_fee: '',
    time_slot_start: '9:00 AM', time_slot_end: '12:00 PM', available_days: 'Mon,Tue,Wed,Thu,Fri',
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!adminService.isAdmin()) {
            navigate('/admin');
            return;
        }
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        setLoading(true);
        try {
            const data = await doctorService.listAllDoctors();
            setDoctors(data.doctors || []);
        } catch (err) {
            if (err.response?.status === 401) {
                adminService.logout();
                navigate('/admin');
            }
            setError('Failed to load doctors');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const toggleDay = (day) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const openEnrollForm = () => {
        setForm({ ...emptyForm });
        setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
        setEditingId(null);
        setShowForm(true);
        setError('');
        setSuccess('');
    };

    const openEditForm = (doctor) => {
        setForm({
            name: doctor.name,
            specialization: doctor.specialization,
            qualification: doctor.qualification,
            experience_years: doctor.experience_years.toString(),
            hospital: doctor.hospital,
            location: doctor.location,
            phone: doctor.phone,
            email: doctor.email,
            consultation_fee: doctor.consultation_fee.toString(),
            time_slot_start: doctor.time_slot_start,
            time_slot_end: doctor.time_slot_end,
            available_days: doctor.available_days,
        });
        setSelectedDays(doctor.available_days.split(','));
        setEditingId(doctor.id);
        setShowForm(true);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (selectedDays.length === 0) {
            setError('Please select at least one available day');
            return;
        }

        const payload = {
            ...form,
            experience_years: parseInt(form.experience_years),
            consultation_fee: parseFloat(form.consultation_fee) || 0,
            available_days: selectedDays.join(','),
        };

        try {
            if (editingId) {
                await doctorService.updateDoctor(editingId, payload);
                setSuccess('Doctor updated successfully!');
            } else {
                await doctorService.enrollDoctor(payload);
                setSuccess('Doctor enrolled successfully!');
            }
            setShowForm(false);
            loadDoctors();
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Operation failed');
        }
    };

    const handleDeactivate = async (doctorId, doctorName) => {
        if (!window.confirm(`Deactivate Dr. ${doctorName}?`)) return;
        try {
            await doctorService.deleteDoctor(doctorId);
            setSuccess(`Dr. ${doctorName} deactivated`);
            loadDoctors();
        } catch (err) {
            setError('Failed to deactivate doctor');
        }
    };

    const handleReactivate = async (doctorId) => {
        try {
            await doctorService.updateDoctor(doctorId, { is_active: true });
            setSuccess('Doctor reactivated');
            loadDoctors();
        } catch (err) {
            setError('Failed to reactivate doctor');
        }
    };

    const handleLogout = () => {
        adminService.logout();
        navigate('/admin');
    };

    return (
        <div className="admin-dashboard">
            {/* Admin Header */}
            <header className="admin-header">
                <div className="admin-header-left">
                    <span className="admin-header-icon">🛡️</span>
                    <div>
                        <h1>Doctor Management</h1>
                        <p>Admin Console</p>
                    </div>
                </div>
                <div className="admin-header-right">
                    <button className="btn-primary" onClick={openEnrollForm}>
                        + Enroll Doctor
                    </button>
                    <button className="btn-outline admin-logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Messages */}
            {error && <div className="alert alert-error admin-alert">{error}</div>}
            {success && <div className="alert alert-success admin-alert">{success}</div>}

            {/* Enrollment / Edit Modal */}
            {showForm && (
                <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>{editingId ? '✏️ Edit Doctor' : '➕ Enroll New Doctor'}</h2>
                            <button className="admin-modal-close" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="admin-enroll-form">
                            <div className="admin-form-grid">
                                <div className="admin-form-field">
                                    <label>Full Name *</label>
                                    <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} required placeholder="Dr. John Doe" />
                                </div>
                                <div className="admin-form-field">
                                    <label>Specialization *</label>
                                    <select value={form.specialization} onChange={e => handleChange('specialization', e.target.value)} required>
                                        <option value="">Select specialization</option>
                                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="admin-form-field">
                                    <label>Qualification *</label>
                                    <input type="text" value={form.qualification} onChange={e => handleChange('qualification', e.target.value)} required placeholder="MBBS, MD" />
                                </div>
                                <div className="admin-form-field">
                                    <label>Experience (years) *</label>
                                    <input type="number" min="0" max="60" value={form.experience_years} onChange={e => handleChange('experience_years', e.target.value)} required placeholder="10" />
                                </div>
                                <div className="admin-form-field">
                                    <label>Hospital / Clinic *</label>
                                    <input type="text" value={form.hospital} onChange={e => handleChange('hospital', e.target.value)} required placeholder="City Hospital" />
                                </div>
                                <div className="admin-form-field">
                                    <label>Location *</label>
                                    <input type="text" value={form.location} onChange={e => handleChange('location', e.target.value)} required placeholder="Mumbai" />
                                </div>
                                <div className="admin-form-field">
                                    <label>Phone *</label>
                                    <input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)} required placeholder="9876543210" />
                                </div>
                                <div className="admin-form-field">
                                    <label>Email *</label>
                                    <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} required placeholder="doctor@hospital.com" />
                                </div>
                                <div className="admin-form-field">
                                    <label>Consultation Fee (₹)</label>
                                    <input type="number" min="0" step="50" value={form.consultation_fee} onChange={e => handleChange('consultation_fee', e.target.value)} placeholder="500" />
                                </div>
                            </div>

                            {/* Time Slot */}
                            <div className="admin-timeslot-section">
                                <h3>🕐 Time Slot</h3>
                                <div className="admin-timeslot-row">
                                    <div className="admin-form-field">
                                        <label>From</label>
                                        <select value={form.time_slot_start} onChange={e => handleChange('time_slot_start', e.target.value)}>
                                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <span className="timeslot-divider">→</span>
                                    <div className="admin-form-field">
                                        <label>To</label>
                                        <select value={form.time_slot_end} onChange={e => handleChange('time_slot_end', e.target.value)}>
                                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Available Days */}
                            <div className="admin-days-section">
                                <h3>📅 Available Days</h3>
                                <div className="admin-days-grid">
                                    {DAYS_OPTIONS.map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            className={`day-chip ${selectedDays.includes(day) ? 'active' : ''}`}
                                            onClick={() => toggleDay(day)}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && <div className="field-warning" style={{ marginBottom: '1rem' }}>{error}</div>}

                            <div className="admin-form-actions">
                                <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">
                                    {editingId ? 'Update Doctor' : 'Enroll Doctor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Doctors Table */}
            <div className="admin-content">
                <div className="admin-stats-row">
                    <div className="admin-stat">
                        <span className="admin-stat-value">{doctors.length}</span>
                        <span className="admin-stat-label">Total Doctors</span>
                    </div>
                    <div className="admin-stat">
                        <span className="admin-stat-value">{doctors.filter(d => d.is_active).length}</span>
                        <span className="admin-stat-label">Active</span>
                    </div>
                    <div className="admin-stat">
                        <span className="admin-stat-value">{doctors.filter(d => !d.is_active).length}</span>
                        <span className="admin-stat-label">Inactive</span>
                    </div>
                    <div className="admin-stat">
                        <span className="admin-stat-value">{new Set(doctors.map(d => d.specialization)).size}</span>
                        <span className="admin-stat-label">Specializations</span>
                    </div>
                </div>

                {loading ? (
                    <div className="admin-loading">
                        <div className="loader"></div>
                        <p>Loading doctors...</p>
                    </div>
                ) : doctors.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">👨‍⚕️</span>
                        <h3>No doctors enrolled yet</h3>
                        <p>Click "Enroll Doctor" to add the first doctor.</p>
                    </div>
                ) : (
                    <div className="table-container admin-table-container">
                        <table className="data-table admin-data-table">
                            <thead>
                                <tr>
                                    <th>Doctor</th>
                                    <th>Specialization</th>
                                    <th>Hospital</th>
                                    <th>Time Slot</th>
                                    <th>Days</th>
                                    <th>Fee</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctors.map(doc => (
                                    <tr key={doc.id} className={!doc.is_active ? 'inactive-row' : ''}>
                                        <td>
                                            <div className="doctor-name-cell">
                                                <strong>{doc.name}</strong>
                                                <small>{doc.qualification}</small>
                                            </div>
                                        </td>
                                        <td><span className="specialization-badge">{doc.specialization}</span></td>
                                        <td>
                                            <div className="doctor-hospital-cell">
                                                {doc.hospital}
                                                <small>{doc.location}</small>
                                            </div>
                                        </td>
                                        <td><span className="time-slot-badge">🕐 {doc.time_slot_start} - {doc.time_slot_end}</span></td>
                                        <td><span className="days-text">{doc.available_days}</span></td>
                                        <td><span className="fee-text">₹{doc.consultation_fee}</span></td>
                                        <td>
                                            <span className={`status-badge ${doc.is_active ? 'status-active' : 'status-inactive'}`}>
                                                {doc.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="admin-actions">
                                                <button className="action-btn edit-btn" onClick={() => openEditForm(doc)} title="Edit">✏️</button>
                                                {doc.is_active ? (
                                                    <button className="action-btn deactivate-btn" onClick={() => handleDeactivate(doc.id, doc.name)} title="Deactivate">🚫</button>
                                                ) : (
                                                    <button className="action-btn activate-btn" onClick={() => handleReactivate(doc.id)} title="Reactivate">✅</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
