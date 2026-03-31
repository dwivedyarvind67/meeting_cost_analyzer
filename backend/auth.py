import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from config import settings

# 🔐 password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM


# ✅ HASH PASSWORD
def hash_password(password: str):
    return pwd_context.hash(password)


# ✅ VERIFY PASSWORD
def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)


# 🔥 ACCESS TOKEN
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=15)  # short
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# 🔥 REFRESH TOKEN
def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)  # long
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# 🔓 DECODE TOKEN
def decode_token(token: str):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload["user_id"]