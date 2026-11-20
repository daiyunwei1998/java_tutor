@echo off
REM Local development: FastAPI (port 8000) + Next.js (port 3000) in two windows. Reads secrets from .env
cd /d "%~dp0"
if not exist .venv (
  echo Creating Python virtual environment...
  py -m venv .venv || python -m venv .venv
  .venv\Scripts\python -m pip install -r requirements-dev.txt
)
if not exist node_modules (
  echo Installing npm packages...
  call npm install
)
start "Java Tutor API" cmd /k "cd /d %~dp0 && .venv\Scripts\python -m uvicorn api.index:app --port 8000 --reload"
start "Java Tutor web" cmd /k "cd /d %~dp0 && npm run dev"
echo Open http://localhost:3000  (admin: http://localhost:3000/admin)
