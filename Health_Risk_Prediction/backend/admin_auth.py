"""
Admin authentication — uses ADMIN_ID/ADMIN_PASSWORD from .env
Completely separate from user authentication.
"""

import os
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from backend.schemas import AdminLogin, AdminToken

# Load environment variables
load_dotenv()

ADMIN_ID = os.getenv("ADMIN_ID", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin@123")
SECRET_KEY = "health-prediction-secure-key"  # Same key as user auth for simplicity
ALGORITHM = "HS256"
ADMIN_TOKEN_EXPIRE_MINUTES = 60 * 12  # 12 hours

router = APIRouter()

# Separate bearer scheme for admin — uses a different token URL
admin_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/admin/login", auto_error=False)


def create_admin_token(expires_delta: Optional[timedelta] = None) -> str:
    to_encode = {"sub": "admin", "is_admin": True}
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ADMIN_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_admin(token: str = Depends(admin_oauth2_scheme)):
    """Dependency that validates admin JWT tokens."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if not payload.get("is_admin"):
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return True


@router.post("/login", response_model=AdminToken)
def admin_login(data: AdminLogin):
    """Authenticate admin using credentials from .env"""
    if data.admin_id != ADMIN_ID or data.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin ID or password",
        )
    token = create_admin_token()
    return {"access_token": token, "token_type": "bearer"}
