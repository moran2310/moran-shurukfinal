Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting Job Portal Project" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing Node processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Gray
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Green
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host 'Backend Server - Port 5000' -ForegroundColor Yellow; node server.js" -PassThru
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Application..." -ForegroundColor Green
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Frontend - Port 3000' -ForegroundColor Yellow; npm start" -PassThru

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Project Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend running on: " -NoNewline
Write-Host "http://localhost:5000" -ForegroundColor Blue
Write-Host "Frontend running on: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Blue
Write-Host ""
Write-Host "Opening browser in 5 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Press any key to exit (servers will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
