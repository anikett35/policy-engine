from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from beanie import PydanticObjectId
from models.user import User
from schemas.validators import RegisterSchema
import os

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token.")
        user = await User.get(PydanticObjectId(user_id))
        if not user:
            raise HTTPException(status_code=401, detail="User not found.")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated.")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterSchema):
    existing_email = await User.find_one(User.email == req.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    existing_username = await User.find_one(User.username == req.username)
    if existing_username:
        raise HTTPException(status_code=400, detail="This username is already taken.")
    user = User(username=req.username, email=req.email,
                hashed_password=pwd_context.hash(req.password), role=req.role)
    await user.insert()
    token = create_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": str(user.id), "username": user.username, "email": user.email, "role": user.role}}

@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    if not form.username or not form.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")
    user = await User.find_one(User.email == form.username)
    if not user or not pwd_context.verify(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated.")
    token = create_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": str(user.id), "username": user.username, "email": user.email, "role": user.role}}

@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {"id": str(current_user.id), "username": current_user.username,
            "email": current_user.email, "role": current_user.role}