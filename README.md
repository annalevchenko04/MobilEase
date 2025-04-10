# Installation of packages
Basic pip installation command
```bash
pip install -r requirements.txt
```
This installs fnm (Fast Node Manager) using Windows Package Manager (winget).
```bash
winget install Schniz.fnm
```
Node packages
```bash
npm install react-router-dom react-scripts@latest bulma moment http-proxy-middleware sass
```
Automatically fixes security vulnerabilities found by npm audit
```bash
npm audit fix 
```
# Don`t forget to create .env file for environmental variables

# Structure of env file
```bash
DATABASE_URL=postgresql://postgres:{password}@localhost:5432/{database_name}
ALGORITHM = HS256
SECRET_KEY={secret_key}
SENDGRID_API_KEY='{sendgrid_api_key}'
```

# Initialize Alembic and perform initial migration
```bash
alembic init alembic
```
## In alembic.ini, set your database URL:
```bash
sqlalchemy.url = postgresql://user:password@localhost/dbname
```
## In alembic/env.py, import your models and set up the target metadata:
### Replace this line:
```bash
target_metadata = None
```
### With:
```bash
from backend.database import Base
target_metadata = Base.metadata
```
## Generate a migration file
```bash
alembic revision --autogenerate -m "initial migration"
```
## Apply migration
```bash
alembic upgrade head
```
# How to run servers
## Backend
First of all go to backend directory
```bash
cd backend
```
And after that load backend server
```bash
uvicorn main:app --reload
```
## Frontend
Go to frontend directory
```bash
cd frontend
```
And start server
```bash
npm start
```
