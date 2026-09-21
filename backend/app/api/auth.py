from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
import jwt
from app.db.database import get_connection, create_user
import bcrypt
import os
import requests
import uuid
from pydantic import BaseModel, EmailStr

SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-key-123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_user_by_email(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, hashed_password, name FROM users WHERE email = %s", (email,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "email": row[1], "hashed_password": row[2], "name": row[3]}
    return None

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = get_user_by_email(email)
    if user is None:
        raise credentials_exception
    return user

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user["email"], "id": user["id"], "name": user["name"]}
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

@router.post("/register")
async def register_user(request: RegisterRequest):
    if get_user_by_email(request.email):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    user_id = str(uuid.uuid4())
    hashed_password = bcrypt.hashpw(request.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    create_user(user_id, request.email, hashed_password, request.name)
    
    # Return access token immediately upon registration
    access_token = create_access_token(
        data={"sub": request.email, "id": user_id, "name": request.name}
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user_id, "email": request.email, "name": request.name}}

class GoogleAuthRequest(BaseModel):
    access_token: str

@router.post("/google")
async def google_auth(request: GoogleAuthRequest):
    # Verify token with Google
    response = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {request.access_token}"}
    )
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")
        
    google_user = response.json()
    email = google_user.get("email")
    name = google_user.get("name", "Google User")
    
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")
        
    user = get_user_by_email(email)
    
    # Auto-provision new user if they don't exist
    if not user:
        user_id = str(uuid.uuid4())
        # Give them a random un-guessable password since they use Google auth
        hashed = bcrypt.hashpw(os.urandom(32), bcrypt.gensalt()).decode('utf-8')
        create_user(user_id, email, hashed, name)
        user = {"id": user_id, "email": email, "name": name}
        
    access_token = create_access_token(
        data={"sub": user["email"], "id": user["id"], "name": user["name"]}
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {"id": current_user["id"], "email": current_user["email"], "name": current_user["name"]}
