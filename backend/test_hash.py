from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
h = pwd.hash("TestPass123!")
print(f"Hash OK: {h}")
print(f"Verify: {pwd.verify('TestPass123!', h)}")
