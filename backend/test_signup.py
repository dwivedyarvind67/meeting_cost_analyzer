import requests

# Test signup
r = requests.post("http://localhost:8000/signup", json={"email": "testuser@demo.com", "password": "TestPass123!"})
print(f"Signup Status: {r.status_code}")
print(f"Signup Body: {r.text}")

# Test login with same credentials
r2 = requests.post("http://localhost:8000/login", json={"email": "testuser@demo.com", "password": "TestPass123!"})
print(f"Login Status: {r2.status_code}")
print(f"Login Body: {r2.text}")
