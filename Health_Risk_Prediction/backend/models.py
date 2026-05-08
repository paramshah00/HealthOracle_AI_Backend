from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    predictions = relationship("PredictionResult", back_populates="user")
    appointments = relationship("Appointment", back_populates="user")

class PredictionResult(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    disease_name = Column(String, index=True)
    input_data = Column(JSON)
    prediction = Column(Integer)
    probability = Column(Float)
    risk_level = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialization = Column(String, nullable=False, index=True)
    qualification = Column(String, nullable=False)
    experience_years = Column(Integer, nullable=False)
    hospital = Column(String, nullable=False)
    location = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=True)   # nullable so legacy admin-added records still work
    consultation_fee = Column(Float, nullable=False, default=0.0)
    time_slot_start = Column(String, nullable=False)  # e.g. "9:00 AM"
    time_slot_end = Column(String, nullable=False)    # e.g. "12:00 PM"
    available_days = Column(String, nullable=False)    # e.g. "Mon,Tue,Wed,Thu,Fri"
    bio = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointments = relationship("Appointment", back_populates="doctor")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=True)
    disease_name = Column(String, nullable=False)
    appointment_date = Column(String, nullable=False)  # YYYY-MM-DD
    status = Column(String, default="pending")  # pending, confirmed, completed, cancelled
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
