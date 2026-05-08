import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import timedelta

from backend.database import get_db
from backend.models import User
from backend.schemas import UserCreate, UserResponse, Token, LoginRequest, RegisterResponse, UserProfileUpdate
from backend.auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user

router = APIRouter()


def _get_password_warnings(password: str) -> list[str]:
    """Generate non-blocking warnings for password strength."""
    warnings = []
    digit_count = sum(1 for c in password if c.isdigit())
    if digit_count < 2:
        warnings.append("Tip: Use at least 2 digits for a stronger password")
    return warnings


def _normalize_phone(value: str) -> str:
    """Strip +91 or 91 prefix from phone for login lookup."""
    cleaned = value.strip()
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("91") and len(cleaned) == 12:
        cleaned = cleaned[2:]
    return cleaned


@router.post("/register", response_model=RegisterResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if phone already exists
    if db.query(User).filter(User.phone == user.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # Generate password warnings (non-blocking)
    password_warnings = _get_password_warnings(user.password)

    hashed_password = get_password_hash(user.password)
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        age=user.age,
        gender=user.gender,
        hashed_password=hashed_password,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return RegisterResponse(
        user=UserResponse.model_validate(new_user),
        password_warnings=password_warnings,
        message="Registration successful! Please login.",
    )


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    username = login_data.username.strip()

    # If it looks like a phone number, normalize it
    if re.match(r"^[\+]?[\d]{10,13}$", username):
        username = _normalize_phone(username)

    # Allow login via email OR phone number
    user = db.query(User).filter(
        or_(User.email == username, User.phone == username)
    ).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    
    if profile_data.phone is not None:
        # Check if phone is taken by another user
        if current_user.phone != profile_data.phone:
            existing = db.query(User).filter(User.phone == profile_data.phone).first()
            if existing:
                raise HTTPException(status_code=400, detail="Phone number already registered")
        current_user.phone = profile_data.phone
        
    if profile_data.age is not None:
        current_user.age = profile_data.age
        
    if profile_data.gender is not None:
        current_user.gender = profile_data.gender

    db.commit()
    db.refresh(current_user)
    return current_user
