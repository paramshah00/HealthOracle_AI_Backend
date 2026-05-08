import re
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    age: Optional[int] = None
    gender: Optional[str] = None
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Strip +91 or 91 prefix if present
        cleaned = v.strip()
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        elif cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = cleaned[2:]
        # Must be exactly 10 digits
        if not re.match(r"^\d{10}$", cleaned):
            raise ValueError("Phone number must be exactly 10 digits")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        errors = []
        if len(v) < 8:
            errors.append("Password must be at least 8 characters")
        if not re.search(r"[a-zA-Z]", v):
            errors.append("Password must contain at least 1 letter")
        if not re.search(r"\d", v):
            errors.append("Password must contain at least 1 digit")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", v):
            errors.append("Password must contain at least 1 special character")
        if errors:
            raise ValueError("; ".join(errors))
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v):
        if v is not None and (v < 5 or v > 100):
            raise ValueError("Age must be between 5 and 100")
        return v

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        if v is not None and v.lower() not in ("male", "female", "other"):
            raise ValueError("Gender must be male, female, or other")
        if v:
            return v.lower()
        return v


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    age: Optional[int] = None
    gender: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str  # Can be email or phone
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class PasswordWarning(BaseModel):
    """Returned alongside token if password has warnings"""
    warnings: List[str] = []


class TokenWithWarnings(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    password_warnings: List[str] = []


class RegisterResponse(BaseModel):
    user: UserResponse
    password_warnings: List[str] = []
    message: str = "Registration successful"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        cleaned = v.strip()
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        elif cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = cleaned[2:]
        if not re.match(r"^\d{10}$", cleaned):
            raise ValueError("Phone number must be exactly 10 digits")
        return cleaned

    @field_validator("age")
    @classmethod
    def validate_age(cls, v):
        if v is not None and (v < 5 or v > 100):
            raise ValueError("Age must be between 5 and 100")
        return v

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        if v is not None and v.lower() not in ("male", "female", "other"):
            raise ValueError("Gender must be male, female, or other")
        if v:
            return v.lower()
        return v


class PredictionRequest(BaseModel):
    feature_data: Dict[str, Any]


class PredictionResponseModel(BaseModel):
    id: int
    disease_name: str
    prediction: int
    probability: float
    risk_level: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════
#  ADMIN SCHEMAS
# ═══════════════════════════════════════════════════

class AdminLogin(BaseModel):
    admin_id: str
    password: str


class AdminToken(BaseModel):
    access_token: str
    token_type: str


# ═══════════════════════════════════════════════════
#  DOCTOR SCHEMAS
# ═══════════════════════════════════════════════════

class DoctorCreate(BaseModel):
    name: str
    specialization: str
    qualification: str
    experience_years: int
    hospital: str
    location: str
    phone: str
    email: EmailStr
    consultation_fee: float = 0.0
    time_slot_start: str   # e.g. "9:00 AM"
    time_slot_end: str     # e.g. "12:00 PM"
    available_days: str    # e.g. "Mon,Tue,Wed,Thu,Fri"

    @field_validator("experience_years")
    @classmethod
    def validate_experience(cls, v):
        if v < 0 or v > 60:
            raise ValueError("Experience must be between 0 and 60 years")
        return v

    @field_validator("consultation_fee")
    @classmethod
    def validate_fee(cls, v):
        if v < 0:
            raise ValueError("Fee cannot be negative")
        return v


class DoctorResponse(BaseModel):
    id: int
    name: str
    specialization: str
    qualification: str
    experience_years: int
    hospital: str
    location: str
    phone: str
    email: str
    consultation_fee: float
    time_slot_start: str
    time_slot_end: str
    available_days: str
    bio: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    hospital: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    consultation_fee: Optional[float] = None
    time_slot_start: Optional[str] = None
    time_slot_end: Optional[str] = None
    available_days: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = None


# ═══════════════════════════════════════════════════
#  DOCTOR AUTH SCHEMAS
# ═══════════════════════════════════════════════════

class DoctorRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    specialization: str
    qualification: str
    experience_years: int
    hospital: str
    location: str
    consultation_fee: float = 0.0
    time_slot_start: str   # e.g. "9:00 AM"
    time_slot_end: str     # e.g. "12:00 PM"
    available_days: str    # e.g. "Mon,Tue,Wed,Thu,Fri"
    bio: Optional[str] = None

    @field_validator("experience_years")
    @classmethod
    def validate_experience(cls, v):
        if v < 0 or v > 60:
            raise ValueError("Experience must be between 0 and 60 years")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class DoctorLoginRequest(BaseModel):
    email: EmailStr
    password: str


class DoctorToken(BaseModel):
    access_token: str
    token_type: str
    doctor: DoctorResponse


class DoctorProfileUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    hospital: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    consultation_fee: Optional[float] = None
    time_slot_start: Optional[str] = None
    time_slot_end: Optional[str] = None
    available_days: Optional[str] = None
    bio: Optional[str] = None


# ═══════════════════════════════════════════════════
#  APPOINTMENT SCHEMAS
# ═══════════════════════════════════════════════════

class AppointmentCreate(BaseModel):
    doctor_id: int
    disease_name: str
    appointment_date: str     # YYYY-MM-DD
    prediction_id: Optional[int] = None
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    user_id: int
    doctor_id: int
    prediction_id: Optional[int] = None
    disease_name: str
    appointment_date: str
    status: str
    notes: Optional[str] = None
    created_at: datetime

    # Doctor details (populated in the route)
    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None
    doctor_hospital: Optional[str] = None
    doctor_time_slot: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
