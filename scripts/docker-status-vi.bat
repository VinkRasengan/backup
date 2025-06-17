@echo off
chcp 65001 >nul
REM =============================================================================
REM Docker Vietnamese Support Script
REM =============================================================================

echo Docker Tieng Viet Support
echo =========================
echo.

echo Kiem tra trang thai Docker...
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo [THANH CONG] Docker dang chay binh thuong!
    docker info | findstr "Server Version"
    echo.
    echo Cac lenh co ban:
    echo    npm run docker:up      - Khoi dong containers
    echo    npm run docker:down    - Dung containers  
    echo    npm run docker:logs    - Xem logs
    echo    npm run docker:fix     - Sua loi Docker
    echo.
) else (
    echo [LOI] Docker Engine da dung
    echo.
    echo Cach khac phuc:
    echo    1. Chay: npm run docker:fix
    echo    2. Hoac mo Docker Desktop tu Start Menu
    echo    3. Doi 1-2 phut cho Docker khoi dong
    echo.
)

pause
