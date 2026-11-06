@echo off
REM AINOS Business Card Scanner - double-click to run on Windows.
REM First time only: it installs the Python packages automatically.
cd /d "%~dp0"
python -c "import pytesseract, cv2, openpyxl, PIL" 2>nul || (
  echo Installing dependencies \(first run\)...
  python -m pip install -r requirements.txt
)
python scan_cards.py
echo.
pause
