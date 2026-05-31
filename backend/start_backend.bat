@echo off
echo Starting FastAPI Backend...
"env\Scripts\uvicorn.exe" app.main:app --port 8080 --reload
pause
