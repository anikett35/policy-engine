from beanie import Document
from pydantic import EmailStr
from datetime import datetime
from typing import Optional

class User(Document):
    username: str
    email: EmailStr
    hashed_password: str
    role: str = "analyst"  # analyst, admin
    is_active: bool = True
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "users"
