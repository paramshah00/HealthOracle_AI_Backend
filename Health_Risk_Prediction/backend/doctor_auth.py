"""
Doctor authentication — self-service register & login.
Doctors get their own JWT with `is_doctor` flag.
"""

from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Doctor
from backend.schemas import (
    DoctorRegister,
    DoctorLoginRequest,
    DoctorToken,
    DoctorResponse,
)

SECRET_KEY = "health-prediction-secure-key"  # Same key used across the app
ALGORITHM = "HS256"
DOCTOR_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

router = APIRouter()

# Separate bearer scheme for doctors
doctor_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/doctor-auth/login", auto_error=False)


# ─── Helpers ───

def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_doctor_token(doctor_id: int, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = {"sub": str(doctor_id), "is_doctor": True}
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=DOCTOR_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_doctor(
    token: str = Depends(doctor_oauth2_scheme),
    db: Session = Depends(get_db),
) -> Doctor:
    """Dependency that validates doctor JWT tokens and returns the Doctor object."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid doctor credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if not payload.get("is_doctor"):
            raise credentials_exception
        doctor_id = payload.get("sub")
        if doctor_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    doctor = db.query(Doctor).filter(Doctor.id == int(doctor_id)).first()
    if doctor is None:
        raise credentials_exception
    return doctor


# ═══════════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════════

@router.post("/register")
def doctor_register(data: DoctorRegister, db: Session = Depends(get_db)):
    """
    Register a new doctor account.
    If a doctor with this email already exists (added by admin) and has no password,
    we 'claim' that profile by setting the password.
    """
    existing = db.query(Doctor).filter(Doctor.email == data.email).first()

    if existing:
        # If the record already has a password, it's already registered
        if existing.hashed_password:
            raise HTTPException(
                status_code=400,
                detail="A doctor with this email is already registered. Please login.",
            )
        # Claim the existing admin-added profile
        existing.hashed_password = _hash_password(data.password)
        existing.name = data.name
        existing.phone = data.phone
        existing.specialization = data.specialization
        existing.qualification = data.qualification
        existing.experience_years = data.experience_years
        existing.hospital = data.hospital
        existing.location = data.location
        existing.consultation_fee = data.consultation_fee
        existing.time_slot_start = data.time_slot_start
        existing.time_slot_end = data.time_slot_end
        existing.available_days = data.available_days
        existing.bio = data.bio
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return {"message": "Profile claimed successfully! Please login.", "doctor_id": existing.id}

    # Create brand-new doctor record
    doctor = Doctor(
        name=data.name,
        email=data.email,
        phone=data.phone,
        hashed_password=_hash_password(data.password),
        specialization=data.specialization,
        qualification=data.qualification,
        experience_years=data.experience_years,
        hospital=data.hospital,
        location=data.location,
        consultation_fee=data.consultation_fee,
        time_slot_start=data.time_slot_start,
        time_slot_end=data.time_slot_end,
        available_days=data.available_days,
        bio=data.bio,
        is_active=True,
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return {"message": "Registration successful! Please login.", "doctor_id": doctor.id}


@router.post("/login", response_model=DoctorToken)
def doctor_login(data: DoctorLoginRequest, db: Session = Depends(get_db)):
    """Authenticate a doctor with email + password."""
    doctor = db.query(Doctor).filter(Doctor.email == data.email).first()

    if not doctor or not doctor.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not _verify_password(data.password, doctor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_doctor_token(doctor.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "doctor": DoctorResponse.model_validate(doctor),
    }
