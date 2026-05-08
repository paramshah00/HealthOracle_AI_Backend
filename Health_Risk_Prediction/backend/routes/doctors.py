"""
Doctor management routes.
- Admin-only: create, update, delete
- User-facing: list, filter, search
- Doctor self-service: view/update profile, view appointments
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import Doctor, Appointment, User
from backend.auth import get_current_user
from backend.admin_auth import get_current_admin
from backend.doctor_auth import get_current_doctor
from backend.schemas import DoctorCreate, DoctorResponse, DoctorUpdate, DoctorProfileUpdate

router = APIRouter()


# ─── Disease → Specialization mapping ───
DISEASE_SPECIALIZATION_MAP = {
    "diabetes": ["Endocrinologist", "Diabetologist"],
    "heart_disease": ["Cardiologist"],
    "hypertension": ["Cardiologist", "Nephrologist"],
    "kidney_disease": ["Nephrologist", "Urologist"],
}


# ═══════════════════════════════════════════════════
#  ADMIN ENDPOINTS
# ═══════════════════════════════════════════════════

@router.post("/", response_model=DoctorResponse)
def enroll_doctor(
    data: DoctorCreate,
    _admin: bool = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Enroll a new doctor (admin only)."""
    existing = db.query(Doctor).filter(Doctor.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A doctor with this email already exists")

    doctor = Doctor(**data.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int,
    data: DoctorUpdate,
    _admin: bool = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update doctor details (admin only)."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(doctor, key, value)

    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/{doctor_id}")
def deactivate_doctor(
    doctor_id: int,
    _admin: bool = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Deactivate a doctor (admin only). Soft-delete by setting is_active=False."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor.is_active = False
    db.commit()
    return {"message": f"Doctor '{doctor.name}' has been deactivated"}


# ═══════════════════════════════════════════════════
#  ADMIN: List all doctors (including inactive)
# ═══════════════════════════════════════════════════

@router.get("/all")
def list_all_doctors(
    _admin: bool = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """List ALL doctors including inactive ones (admin only)."""
    doctors = db.query(Doctor).order_by(desc(Doctor.created_at)).all()
    return {
        "total": len(doctors),
        "doctors": [DoctorResponse.model_validate(d).model_dump() for d in doctors],
    }


# ═══════════════════════════════════════════════════
#  USER-FACING ENDPOINTS (require normal user auth)
# ═══════════════════════════════════════════════════

@router.get("/")
def list_doctors(
    specialization: str = Query(None, description="Filter by specialization"),
    search: str = Query(None, description="Search by name or hospital"),
    db: Session = Depends(get_db),
):
    """List all active doctors. Optionally filter by specialization or search."""
    query = db.query(Doctor).filter(Doctor.is_active == True)

    if specialization:
        query = query.filter(Doctor.specialization == specialization)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Doctor.name.ilike(search_term)) | (Doctor.hospital.ilike(search_term))
        )

    doctors = query.order_by(Doctor.name).all()
    return {
        "total": len(doctors),
        "doctors": [DoctorResponse.model_validate(d).model_dump() for d in doctors],
    }


@router.get("/specializations")
def list_specializations(db: Session = Depends(get_db)):
    """Get all unique specializations from active doctors."""
    results = (
        db.query(Doctor.specialization)
        .filter(Doctor.is_active == True)
        .distinct()
        .all()
    )
    return {"specializations": sorted([r[0] for r in results])}


@router.get("/by-disease/{disease}")
def get_doctors_by_disease(
    disease: str,
    db: Session = Depends(get_db),
):
    """Get doctors whose specialization matches a disease."""
    specializations = DISEASE_SPECIALIZATION_MAP.get(disease, [])
    if not specializations:
        return {"total": 0, "doctors": [], "specializations": []}

    doctors = (
        db.query(Doctor)
        .filter(Doctor.is_active == True, Doctor.specialization.in_(specializations))
        .order_by(Doctor.name)
        .all()
    )
    return {
        "total": len(doctors),
        "doctors": [DoctorResponse.model_validate(d).model_dump() for d in doctors],
        "specializations": specializations,
    }


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
):
    """Get doctor details by ID."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id, Doctor.is_active == True).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


# ═══════════════════════════════════════════════════
#  DOCTOR SELF-SERVICE ENDPOINTS (require doctor auth)
# ═══════════════════════════════════════════════════

@router.get("/me/profile", response_model=DoctorResponse)
def get_my_profile(
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Get the currently logged-in doctor's profile."""
    return current_doctor


@router.put("/me/profile", response_model=DoctorResponse)
def update_my_profile(
    data: DoctorProfileUpdate,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Update the currently logged-in doctor's own profile."""
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_doctor, key, value)

    db.commit()
    db.refresh(current_doctor)
    return current_doctor


@router.get("/me/appointments")
def get_my_appointments(
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Get all appointments booked with the logged-in doctor."""
    appointments = (
        db.query(Appointment)
        .filter(Appointment.doctor_id == current_doctor.id)
        .order_by(desc(Appointment.created_at))
        .all()
    )

    result = []
    for appt in appointments:
        patient = db.query(User).filter(User.id == appt.user_id).first()
        result.append({
            "id": appt.id,
            "patient_name": patient.full_name if patient else "Unknown",
            "patient_email": patient.email if patient else "",
            "patient_phone": patient.phone if patient else "",
            "disease_name": appt.disease_name,
            "appointment_date": appt.appointment_date,
            "status": appt.status,
            "notes": appt.notes,
            "created_at": appt.created_at.isoformat(),
        })

    return {"total": len(result), "appointments": result}


@router.put("/me/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    status: str = Query(..., description="New status: confirmed, completed, cancelled"),
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    """Update the status of an appointment (doctor only)."""
    valid_statuses = ("confirmed", "completed", "cancelled")
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(valid_statuses)}")

    appt = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id, Appointment.doctor_id == current_doctor.id)
        .first()
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.status = status
    db.commit()
    return {"message": f"Appointment status updated to '{status}'", "status": status}
