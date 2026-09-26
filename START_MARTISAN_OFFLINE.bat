@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\vite\bin\vite.js" (
  echo Frontend packages are missing. Connect to the internet once and run: npm install
  pause
  exit /b 1
)

if not exist "backend\.venv\Scripts\python.exe" (
  echo Python backend is not set up. Connect to the internet once and run: npm run setup:backend
  pause
  exit /b 1
)

echo Starting Martisan locally. Keep the server window open while using the app.
start "Martisan local app" cmd.exe /k "cd /d ""%~dp0"" && npm run dev:all"

for /L %%i in (1,1,60) do (
  powershell -NoProfile -Command "try { $web=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:5173/'; $api=Invoke-RestMethod 'http://127.0.0.1:8001/api/health'; if ($web.StatusCode -eq 200 -and $api.apiVersion -eq 2) { exit 0 } } catch { exit 1 }"
  if not errorlevel 1 goto ready
  timeout /t 1 /nobreak >nul
)

echo Martisan did not become ready. Check the server window for a port or setup error.
pause
exit /b 1

:ready
start "" "http://127.0.0.1:5173/"
echo Martisan is running at http://127.0.0.1:5173/
echo Core marketplace and price tools run locally. Cloud AI transcription needs internet and an API key.
endlocal
