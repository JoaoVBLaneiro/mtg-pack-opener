# Start backend
Start-Process powershell -ArgumentList "cd backend; python -m uvicorn app.main:app --reload"

# Small delay so backend starts first
Start-Sleep -Seconds 2

# Start frontend
Start-Process powershell -ArgumentList "cd frontend; npm run dev"