from backend.main import register
from backend.schemas import UserCreate
from backend.database import SessionLocal

db = SessionLocal()
user = UserCreate(name="Tester", email="test@tester.com", password="password")
try:
    register(user=user, db=db)
    print("Registration successful!")
except Exception as e:
    import traceback
    traceback.print_exc()
