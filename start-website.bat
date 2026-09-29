@echo off
REM =============================================================================
REM  FoodieZone — one click local server (Windows)
REM
REM  Is file ko DOUBLE-CLICK karein:
REM    1. Node check hoga (aur PATH me nahi milega to common paths se dhoondhega)
REM    2. Zarurat ho to packages install honge (pehli baar 2-3 minute)
REM    3. Website server start hoga
REM    4. Server READY hone ke BAAD hi Chrome me website khulegi
REM       (pehle khulne par "site can't be reached" aata tha — ab nahi aayega)
REM
REM  Band karne ke liye: ye black window close karein (ya Ctrl + C)
REM =============================================================================
setlocal
cd /d "%~dp0"

echo.
echo   ==============================================
echo    FoodieZone  -  local website starter
echo   ==============================================
echo.

REM ---------------------------------------------------------------- Node check
where node >nul 2>nul
if errorlevel 1 (
  for %%P in (
    "%ProgramFiles%\nodejs"
    "%ProgramFiles(x86)%\nodejs"
    "%LOCALAPPDATA%\Programs\node-v24.19.0-win-x64"
    "%LOCALAPPDATA%\Programs\nodejs"
    "%APPDATA%\nvm\current"
  ) do (
    if exist "%%~P\node.exe" set "PATH=%%~P;%PATH%"
  )
)

where node >nul 2>nul
if errorlevel 1 (
  echo   [X] Node.js nahi mila.
  echo.
  echo       Solution: https://nodejs.org se Node.js LTS install karein
  echo       (Default settings theek hain), phir ye file dobara chalayein.
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set "NODEVER=%%v"
echo   [OK] Node.js %NODEVER%

REM --------------------------------------------------------------- Dependencies
if not exist "node_modules" (
  echo   [*] Pehli baar: packages install ho rahe hain, 2-3 minute lagenge...
  echo.
  call npm install
  if errorlevel 1 (
    echo   [X] npm install fail hua. Internet connection check karein.
    pause
    exit /b 1
  )
  echo   [OK] Packages install ho gaye
)

REM --------------------------------------------------- Browser (ready hone par)
REM Server 200 de raha ho tabhi browser kholein — warna Chrome error dikhata hai.
echo   [*] Server start ho raha hai...
start "" /b powershell -NoProfile -WindowStyle Hidden -Command ^
  "$url='http://localhost:5173'; for($i=0;$i -lt 90;$i++){ try{ if((Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200){ Start-Process $url; exit 0 } }catch{}; Start-Sleep -Milliseconds 700 }"

echo.
echo   ==============================================
echo    Website:  http://localhost:5173
echo.
echo    Chrome me nahi khula? Manually type karein:
echo      http://localhost:5173
echo.
echo    Server band karne ke liye: Ctrl + C  (ya window close)
echo   ==============================================
echo.

call npm run dev

endlocal
