import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, doctorService } from '../services/api';
import Sidebar from '../components/Sidebar';
import '../styles/index.css';

const Doctors = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [selectedSpec, setSelectedSpec] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authService.isAuthenticated()) { navigate('/auth'); return; }
        loadSpecializations();
        loadDoctors();
    }, []);

    const loadSpecializations = async () => {
        try {
            const specs = await doctorService.getSpecializations();
            setSpecializations(specs);
        } catch (err) { console.error(err); }
    };

    const loadDoctors = async (spec = '', search = '') => {
        setLoading(true);
        try {
            const data = await doctorService.listDoctors(spec, search);
            setDoctors(data.doctors || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleFilterChange = (spec) => {
        setSelectedSpec(spec);
        loadDoctors(spec, searchTerm);
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        loadDoctors(selectedSpec, term);
    };

    const handleBookAppointment = (doctor) => {
        navigate('/book-appointment', { state: { doctor } });
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>👨‍⚕️ Find <span className="accent-text">Doctors</span></h1>
                    <p>Browse specialized doctors and book appointments</p>
                </div>

                {/* Filters */}
                <div className="doctors-filter-bar">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="🔍 Search by name or hospital..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    <div className="spec-filter">
                        <button
                            className={`disease-chip ${selectedSpec === '' ? 'active' : ''}`}
                            onClick={() => handleFilterChange('')}
                        >
                            All
                        </button>
                        {specializations.map(spec => (
                            <button
                                key={spec}
                                className={`disease-chip ${selectedSpec === spec ? 'active' : ''}`}
                                onClick={() => handleFilterChange(spec)}
                            >
                                {spec}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Doctor Cards */}
                {loading ? (
                    <div className="admin-loading">
                        <div className="loader"></div>
                        <p>Loading doctors...</p>
                    </div>
                ) : doctors.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">👨‍⚕️</span>
                        <h3>No doctors found</h3>
                        <p>{selectedSpec ? `No ${selectedSpec} doctors available. Try a different specialization.` : 'No doctors have been enrolled yet.'}</p>
                    </div>
                ) : (
                    <div className="doctor-cards-grid">
                        {doctors.map(doc => (
                            <div key={doc.id} className="doctor-card">
                                <div className="doctor-card-header">
                                    <div className="doctor-avatar">
                                        {doc.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="doctor-card-info">
                                        <h3>{doc.name}</h3>
                                        <span className="specialization-badge">{doc.specialization}</span>
                                    </div>
                                </div>

                                <div className="doctor-card-details">
                                    <div className="doctor-detail-row">
                                        <span className="detail-icon">🎓</span>
                                        <span>{doc.qualification} • {doc.experience_years} yrs experience</span>
                                    </div>
                                    <div className="doctor-detail-row">
                                        <span className="detail-icon">🏥</span>
                                        <span>{doc.hospital}, {doc.location}</span>
                                    </div>
                                    <div className="doctor-detail-row">
                                        <span className="detail-icon">🕐</span>
                                        <span className="time-highlight">{doc.time_slot_start} - {doc.time_slot_end}</span>
                                    </div>
                                    <div className="doctor-detail-row">
                                        <span className="detail-icon">📅</span>
                                        <span>{doc.available_days}</span>
                                    </div>
                                    <div className="doctor-detail-row">
                                        <span className="detail-icon">💰</span>
                                        <span className="fee-highlight">₹{doc.consultation_fee}</span>
                                    </div>
                                </div>

                                <button
                                    className="btn-primary doctor-book-btn"
                                    onClick={() => handleBookAppointment(doc)}
                                >
                                    Book Appointment →
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Doctors;
