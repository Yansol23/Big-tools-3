@echo off
setlocal enabledelayedexpansion
REM ========================================
REM    Big Tools - Iniciar Sistema
REM    Ejecuta este archivo para iniciar el sistema
REM ========================================

title Big Tools - Sistema Experto

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Python no está instalado o no está en el PATH
    echo.
    echo Por favor instala Python desde: https://www.python.org/
    echo Durante la instalación, marca "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

REM Verificar si las dependencias están instaladas
echo.
echo [1/4] Verificando dependencias...
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo Instalando dependencias (esto puede tardar unos minutos)...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo [ERROR] No se pudieron instalar las dependencias
        echo.
        pause
        exit /b 1
    )
    echo Dependencias instaladas correctamente
) else (
    echo Dependencias OK
)

echo.
echo [2/4] Iniciando servidor backend...
echo.

REM Obtener la IP local para acceso en red
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%a
    set LOCAL_IP=!LOCAL_IP:~1!
    goto :found_ip
)
:found_ip

REM Iniciar el backend en una ventana minimizada
echo Iniciando servidor en segundo plano...
start /min "Big Tools - Backend" cmd /k "cd /d %~dp0Backend && echo Iniciando servidor... && python -m uvicorn app:app --host 0.0.0.0 --port 8000"

REM Esperar a que el servidor inicie
echo Esperando a que el servidor inicie (esto puede tardar unos segundos)...
timeout /t 8 /nobreak >nul

REM Verificar si el puerto está en uso (servidor iniciado)
netstat -an | findstr ":8000" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ADVERTENCIA] El servidor puede estar tardando en iniciar...
    echo Revisa la ventana minimizada "Big Tools - Backend" para ver errores
    timeout /t 3 /nobreak >nul
)

echo.
echo [3/4] Servidor iniciado correctamente!
echo.
echo ========================================
echo    Sistema Big Tools - Activo
echo ========================================
echo.
echo URL Local:    http://127.0.0.1:8000
if defined LOCAL_IP (
    echo URL Red:      http://%LOCAL_IP%:8000
)
echo.
echo Credenciales:
echo   Usuario: admin
echo   Contraseña: 1234
echo.
echo ========================================
echo.

echo [4/4] Abriendo aplicación en el navegador...
start "" "http://127.0.0.1:8000"

echo.
echo Sistema iniciado correctamente!
echo.
echo IMPORTANTE: No cierres esta ventana mientras uses el sistema.
echo Para detener el servidor, cierra esta ventana o presiona Ctrl+C
echo.
echo ========================================
echo.

REM Mantener la ventana abierta
pause

REM Al cerrar, detener el servidor
echo.
echo Deteniendo servidor...
taskkill /FI "WINDOWTITLE eq Big Tools - Backend*" /T /F >nul 2>&1
for /f "tokens=2" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo Servidor detenido.
timeout /t 2 >nul

