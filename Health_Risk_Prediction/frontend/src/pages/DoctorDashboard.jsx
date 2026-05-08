import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doctorAuthService, doctorPortalService } from '../services/api';
import DoctorSidebar from '../components/DoctorSidebar';
import '../styles/index.css';

const SPECIALIZATIONS = [
    'Cardiologist', 'Dermatologist', 'Endocrinologist', 'Diabetologist',
    'Gastroenterologist', 'General Physician', 'Nephrologist',
    'Neurologist', 'Oncologist', 'Orthopedic', 'Pediatrician',
    'Psychiatrist', 'Pulmonologist', 'Urologist',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(() => {
        if (location.hash === '#appointments') return 'appointments';
        return 'overview';
    });
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [editDays, setEditDays] = useState([]);
    const [saveLoading, setSaveLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        if (!doctorAuthService.isAuthenticated()) {
            navigate('/doctor/auth');
            return;
        }
        loadData();
    }, []);

    useEffect(() => {
        const hash = location.hash;
        if (hash === '#appointments') setActiveTab('appointments');
        else if (hash === '#profile') setActiveTab('overview');
        else setActiveTab('overview');
    }, [location.hash]);

    const loadData = async () => {
        try {
            const [profileRes, apptRes] = await Promise.all([
                doctorPortalService.getProfile(),
                doctorPortalService.getMyAppointments(),
            ]);
            setProfile(profileRes);
            setAppointments(apptRes.appointments || []);
            // Also update localStorage so sidebar stays fresh
            localStorage.setItem('doctor', JSON.stringify(profileRes));
        } catch (err) {
            console.error('Failed to load doctor data:', err);
            if (err.response?.status === 401) {
                doctorAuthService.logout();
                navigate('/doctor/auth');
            }
        } finally {
            setLoading(false);
        }
    };

    const startEdit = () => {
        setEditData({
            name: profile.name || '',
            specialization: profile.specialization || '',
            qualification: profile.qualification || '',
            experience_years: profile.experience_years || 0,
            hospital: profile.hospital || '',
            location: profile.location || '',
            phone: profile.phone || '',
            consultation_fee: profile.consultation_fee || 0,
            time_slot_start: profile.time_slot_start || '',
            time_slot_end: profile.time_slot_end || '',
            bio: profile.bio || '',
        });
        setEditDays(profile.available_days ? profile.available_days.split(',') : []);
        setEditing(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const toggleEditDay = (day) => {
        setEditDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const saveProfile = async () => {
        setSaveLoading(true);
        try {
            const payload = {
                ...editData,
                experience_years: parseInt(editData.experience_years) || 0,
                consultation_fee: parseFloat(editData.consultation_fee) || 0,
                available_days: editDays.join(','),
            };
            const updated = await doctorPortalService.updateProfile(payload);
            setProfile(updated);
            localStorage.setItem('doctor', JSON.stringify(updated));
            setEditing(false);
            setAlert({ type: 'success', message: 'Profile updated successfully!' });
            setTimeout(() => setAlert(null), 3000);
        } catch (err) {
            setAlert({ type: 'error', message: err.response?.data?.detail || 'Failed to update profile' });
        } finally {
            setSaveLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await doctorPortalService.updateAppointmentStatus(id, status);
            setAppointments(prev =>
                prev.map(a => a.id === id ? { ...a, status } : a)
            );
            setAlert({ type: 'success', message: `Appointment ${status}` });
            setTimeout(() => setAlert(null), 3000);
        } catch (err) {
            setAlert({ type: 'error', message: err.response?.data?.detail || 'Failed to update status' });
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            pending: 'risk-moderate',
            confirmed: 'risk-low',
            completed: 'risk-low',
            cancelled: 'risk-critical',
        };
        return map[status] || 'risk-moderate';
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <DoctorSidebar />
                <main className="dashboard-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="loader" style={{ width: 32, height: 32 }}></div>
                </main>
            </div>
        );
    }

    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
    const completedCount = appointments.filter(a => a.status === 'completed').length;

    return (
        <div className="dashboard-layout">
            <DoctorSidebar />
            <main className="dashboard-main">
                <style>{`
                    .doc-tabs { display: flex; gap: 0.3rem; margin-bottom: 2rem; }
                    .doc-tab {
                        padding: 0.6rem 1.4rem;
                        border-radius: 99px;
                        border: 1px solid var(--border);
                        background: transparent;
                        color: var(--text-2);
                        font-size: 0.85rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: var(--transition);
                        font-family: 'Plus Jakarta Sans', sans-serif;
                    }
                    .doc-tab.active {
                        background: var(--accent-dim);
                        border-color: var(--accent);
                        color: var(--accent);
                    }
                    .doc-tab:hover { border-color: var(--accent); }
                    .profile-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                        gap: 1rem;
                    }
                    .profile-item {
                        background: var(--bg-card);
                        border: 1px solid var(--border);
                        border-radius: var(--radius-md);
                        padding: 1.2rem;
                    }
                    .profile-item-label {
                        font-size: 0.72rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.06em;
                        color: var(--text-3);
                        margin-bottom: 0.35rem;
                    }
                    .profile-item-value {
                        font-size: 1rem;
                        font-weight: 600;
                        color: var(--text-1);
                    }
                    .day-selector { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.4rem; }
                    .day-chip {
                        padding: 0.4rem 0.8rem;
                        border-radius: 99px;
                        border: 1px solid var(--border);
                        background: transparent;
                        color: var(--text-2);
                        font-size: 0.78rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: var(--transition);
                        font-family: 'Plus Jakarta Sans', sans-serif;
                    }
                    .day-chip.active {
                        background: var(--accent-dim);
                        border-color: var(--accent);
                        color: var(--accent);
                    }
                    .day-chip:hover { border-color: var(--accent); }
                    .action-btns { display: flex; gap: 0.4rem; }
                    .action-btn {
                        padding: 0.3rem 0.7rem;
                        border-radius: 8px;
                        border: 1px solid var(--border);
                        background: transparent;
                        font-size: 0.72rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: var(--transition);
                        font-family: 'Plus Jakarta Sans', sans-serif;
                    }
                    .action-btn.confirm { color: var(--accent); border-color: rgba(0,200,150,0.3); }
                    .action-btn.confirm:hover { background: var(--accent-dim); }
                    .action-btn.complete { color: var(--accent-2); border-color: rgba(79,142,247,0.3); }
                    .action-btn.complete:hover { background: var(--accent-2-dim); }
                    .action-btn.cancel { color: var(--danger); border-color: rgba(244,63,94,0.3); }
                    .action-btn.cancel:hover { background: var(--danger-dim); }
                `}</style>

                {/* Header */}
                <div className="dashboard-header">
                    <h1>Welcome, <span className="accent-text">Dr. {profile?.name?.split(' ').pop()}</span></h1>
                    <p>Manage your profile and patient appointments.</p>
                </div>

                {alert && (
                    <div className={`alert alert-${alert.type}`} style={{ marginBottom: '1.5rem' }}>
                        {alert.message}
                    </div>
                )}

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📅</div>
                        <div className="stat-info">
                            <div className="stat-value">{appointments.length}</div>
                            <div className="stat-label">Total Appointments</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <div className="stat-value">{pendingCount}</div>
                            <div className="stat-label">Pending</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <div className="stat-value">{confirmedCount}</div>
                            <div className="stat-label">Confirmed</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🏁</div>
                        <div className="stat-info">
                            <div className="stat-value">{completedCount}</div>
                            <div className="stat-label">Completed</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="doc-tabs">
                    <button className={`doc-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); window.location.hash = '#profile'; }}>
                        My Profile
                    </button>
                    <button className={`doc-tab ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => { setActiveTab('appointments'); window.location.hash = '#appointments'; }}>
                        Appointments ({appointments.length})
                    </button>
                </div>

                {/* Profile Tab */}
                {activeTab === 'overview' && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Profile Details</h2>
                            {!editing && (
                                <button className="btn-primary btn-sm" onClick={startEdit}>Edit Profile</button>
                            )}
                        </div>

                        {!editing ? (
                            <div className="profile-grid">
                                <div className="profile-item">
                                    <div className="profile-item-label">Name</div>
                                    <div className="profile-item-value">{profile?.name}</div>
                                </div>
                                <div className="profile-item">
                                    <div className="profile-item-label">Email</div>
                                    <div className="profile-item-value">{profile?.email}</div>
                                </div>
                                <div className="profile-item">
                                    <div className="profile-item-label">Phone</div>
                                    <div className="profile-item-value">{profile?.phone}</div>
                                </div>
                                <div className="profile-item">
                                    <div className="profile-item-label">Specialization</div>
                                    <div className="profile-item-value">{profile?.specialization}</div>
                                </div>
                                <div className="profile-item">
                                    <div className="profile-item-label">Qualification</div>
                                    <div className="profile-item-value">{profile?.qualification}</div>
                                </div>
                                <div className="profile-item">
                                    <div className="profile-item-label">Experience</div>
                                    <div className="profile-item-value">{profile?.experience_years} years</div>
                                </div>
                                <div className="profile-item">
                                    <div className="profile-item-label">Hospital</div>
                                    <div className="profile-item-value">{profile?.hospital}</div>
                                </div>
                                <div className="profile-item">
                                    <div className="profile-item-label">Location</div>
                                    <div className="profile-item-value">{profile?.location}</div>
                                </div>
                                <div className="profile-item">
                                    <div className="profile-item-label">Consultation Fee</div>
                                    <div className="profile-item-value">₹{profile?.consultation_fee}</div>
                                </div>
                                <div className="profile-item">
                                    <div className="profile-item-label">Time Slot</div>
                                    <div className="profile-item-value">{profile?.time_slot_start} – {profile?.time_slot_end}</div>
                                </div>
                                <div className="profile-item">
                                    <div className="profile-item-label">Available Days</div>
                                    <div className="profile-item-value">{profile?.available_days}</div>
                                </div>
                                {profile?.bio && (
                                    <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                                        <div className="profile-item-label">Bio</div>
                                        <div className="profile-item-value" style={{ fontWeight: 400, fontSize: '0.9rem', lineHeight: 1.6 }}>{profile.bio}</div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Edit Form */
                            <div style={{ maxWidth: 600 }}>
                                <div className="input-group">
                                    <label>Name</label>
                                    <input type="text" name="name" value={editData.name} onChange={handleEditChange} />
                                </div>
                                <div className="input-row">
                                    <div className="input-group half">
                                        <label>Specialization</label>
                                        <select name="specialization" value={editData.specialization} onChange={handleEditChange} className="select-input">
                                            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group half">
                                        <label>Qualification</label>
                                        <input type="text" name="qualification" value={editData.qualification} onChange={handleEditChange} />
                                    </div>
                                </div>
                                <div className="input-row">
                                    <div className="input-group half">
                                        <label>Experience (years)</label>
                                        <input type="number" name="experience_years" value={editData.experience_years} onChange={handleEditChange} min="0" max="60" />
                                    </div>
                                    <div className="input-group half">
                                        <label>Consultation Fee (₹)</label>
                                        <input type="number" name="consultation_fee" value={editData.consultation_fee} onChange={handleEditChange} min="0" />
                                    </div>
                                </div>
                                <div className="input-row">
                                    <div className="input-group half">
                                        <label>Hospital / Clinic</label>
                                        <input type="text" name="hospital" value={editData.hospital} onChange={handleEditChange} />
                                    </div>
                                    <div className="input-group half">
                                        <label>Location</label>
                                        <input type="text" name="location" value={editData.location} onChange={handleEditChange} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Phone</label>
                                    <input type="text" name="phone" value={editData.phone} onChange={handleEditChange} />
                                </div>
                                <div className="input-row">
                                    <div className="input-group half">
                                        <label>Slot Start</label>
                                        <input type="text" name="time_slot_start" value={editData.time_slot_start} onChange={handleEditChange} />
                                    </div>
                                    <div className="input-group half">
                                        <label>Slot End</label>
                                        <input type="text" name="time_slot_end" value={editData.time_slot_end} onChange={handleEditChange} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Available Days</label>
                                    <div className="day-selector">
                                        {DAYS.map(day => (
                                            <button
                                                type="button"
                                                key={day}
                                                className={`day-chip ${editDays.includes(day) ? 'active' : ''}`}
                                                onClick={() => toggleEditDay(day)}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Bio</label>
                                    <input type="text" name="bio" value={editData.bio} onChange={handleEditChange} placeholder="Brief introduction..." />
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                                    <button className="btn-primary" onClick={saveProfile} disabled={saveLoading}>
                                        {saveLoading ? <div className="loader"></div> : 'Save Changes'}
                                    </button>
                                    <button className="btn-outline" onClick={() => setEditing(false)}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Appointments Tab */}
                {activeTab === 'appointments' && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Patient Appointments</h2>
                        </div>

                        {appointments.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">📅</span>
                                <h3>No appointments yet</h3>
                                <p>When patients book appointments with you, they'll appear here.</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Contact</th>
                                            <th>Disease</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map((appt) => (
                                            <tr key={appt.id}>
                                                <td>{appt.patient_name}</td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
                                                    {appt.patient_email}<br />{appt.patient_phone}
                                                </td>
                                                <td>{appt.disease_name}</td>
                                                <td>{appt.appointment_date}</td>
                                                <td>
                                                    <span className={`risk-badge ${getStatusBadge(appt.status)}`}>
                                                        {appt.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-btns">
                                                        {appt.status === 'pending' && (
                                                            <>
                                                                <button className="action-btn confirm" onClick={() => updateStatus(appt.id, 'confirmed')}>
                                                                    Confirm
                                                                </button>
                                                                <button className="action-btn cancel" onClick={() => updateStatus(appt.id, 'cancelled')}>
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        )}
                                                        {appt.status === 'confirmed' && (
                                                            <button className="action-btn complete" onClick={() => updateStatus(appt.id, 'completed')}>
                                                                Complete
                                                            </button>
                                                        )}
                                                        {(appt.status === 'completed' || appt.status === 'cancelled') && (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>—</span>
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
                )}
            </main>
        </div>
    );
};

export default DoctorDashboard;
