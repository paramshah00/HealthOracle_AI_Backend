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
