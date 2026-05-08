import React, { useState } from 'react';
import { authService } from '../services/api';

const UserProfileModal = ({ isOpen, onClose, user, onProfileUpdated }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        age: user?.age || '',
        gender: user?.gender || ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
        setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const dataToUpdate = {
                full_name: formData.full_name,
                phone: formData.phone,
                age: formData.age ? parseInt(formData.age, 10) : null,
                gender: formData.gender || null
            };
            const updatedUser = await authService.updateProfile(dataToUpdate);
            setSuccess(true);
            if (onProfileUpdated) {
                onProfileUpdated(updatedUser);
            }
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>User Profile</h2>
                    <button className="modal-close-btn" onClick={onClose} title="Close">&times;</button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">Profile updated successfully!</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your full name"
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Email <span style={{ textTransform: 'none', color: 'var(--text-3)' }}>(Cannot be changed)</span></label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            style={{ cursor: 'not-allowed', opacity: 0.6 }}
                        />
                    </div>

                    <div className="input-group">
                        <label>Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            placeholder="10-digit mobile number"
                        />
                    </div>

                    <div className="input-row" style={{ marginBottom: '1.5rem' }}>
                        <div className="input-group half" style={{ marginBottom: 0 }}>
                            <label>Age</label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                min="5" max="100"
                                placeholder="Your age"
                            />
                        </div>
                        <div className="input-group half" style={{ marginBottom: 0 }}>
                            <label>Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="select-input"
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-outline" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="loader" style={{ marginRight: '8px', width: '14px', height: '14px', borderWidth: '2px' }}></span>
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfileModal;
