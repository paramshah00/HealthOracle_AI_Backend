"""
Appointment booking routes.
Users can book, view, and cancel appointments.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import User, Doctor, Appointment
from backend.auth import get_current_user
from backend.schemas import AppointmentCreate, AppointmentResponse

router = APIRouter()


@router.post("/")
def book_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Book a new appointment with a doctor."""
    # Verify doctor exists and is active
    doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id, Doctor.is_active == True).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found or not available")

    appointment = Appointment(
        user_id=current_user.id,
        doctor_id=data.doctor_id,
        prediction_id=data.prediction_id,
        disease_name=data.disease_name,
        appointment_date=data.appointment_date,
        notes=data.notes,
        status="pending",
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return {
        "id": appointment.id,
        "message": "Appointment booked successfully",
        "doctor_name": doctor.name,
        "doctor_specialization": doctor.specialization,
        "doctor_hospital": doctor.hospital,
        "doctor_time_slot": f"{doctor.time_slot_start} - {doctor.time_slot_end}",
        "appointment_date": appointment.appointment_date,
        "status": appointment.status,
    }


@router.get("/")
def get_my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's appointments."""
    appointments = (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .order_by(desc(Appointment.created_at))
        .all()
    )

    result = []
    for appt in appointments:
        doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()
        result.append({
            "id": appt.id,
            "user_id": appt.user_id,
            "doctor_id": appt.doctor_id,
            "prediction_id": appt.prediction_id,
            "disease_name": appt.disease_name,
            "appointment_date": appt.appointment_date,
            "status": appt.status,
            "notes": appt.notes,
            "created_at": appt.created_at.isoformat(),
            "doctor_name": doctor.name if doctor else "Unknown",
            "doctor_specialization": doctor.specialization if doctor else "",
            "doctor_hospital": doctor.hospital if doctor else "",
            "doctor_time_slot": f"{doctor.time_slot_start} - {doctor.time_slot_end}" if doctor else "",
        })

    return {"total": len(result), "appointments": result}


@router.get("/{appointment_id}")
def get_appointment_detail(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a specific appointment."""
    appt = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id, Appointment.user_id == current_user.id)
        .first()
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()
    return {
        "id": appt.id,
        "user_id": appt.user_id,
        "doctor_id": appt.doctor_id,
        "prediction_id": appt.prediction_id,
        "disease_name": appt.disease_name,
        "appointment_date": appt.appointment_date,
        "status": appt.status,
        "notes": appt.notes,
        "created_at": appt.created_at.isoformat(),
        "doctor_name": doctor.name if doctor else "Unknown",
        "doctor_specialization": doctor.specialization if doctor else "",
        "doctor_hospital": doctor.hospital if doctor else "",
        "doctor_location": doctor.location if doctor else "",
        "doctor_phone": doctor.phone if doctor else "",
        "doctor_time_slot": f"{doctor.time_slot_start} - {doctor.time_slot_end}" if doctor else "",
        "doctor_fee": doctor.consultation_fee if doctor else 0,
    }


@router.put("/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel an appointment (only if pending or confirmed)."""
    appt = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id, Appointment.user_id == current_user.id)
        .first()
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appt.status in ("completed", "cancelled"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel an appointment that is already {appt.status}",
        )

    appt.status = "cancelled"
    db.commit()
    return {"message": "Appointment cancelled successfully", "status": "cancelled"}
