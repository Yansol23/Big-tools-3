@echo off
REM ========================================
REM    Big Tools - Diagnóstico de Problemas
REM ========================================

title Big Tools - Diagnóstico

echo.
echo ========================================
echo    Diagnóstico del Sistema
echo ========================================
echo.

REM 1. Verificar Python
echo [1] Verificando Python...
python --version 2>nul
if errorlevel 1 (
    echo [ERROR] Python no está instalado o no está en el PATH
    echo.
    echo Solución: Instala Python desde https://www.python.org/
    echo Durante la instalación, marca "Add Python to PATH"
    echo.
) else (
    echo [OK] Python está instalado
    python --version
)
echo.

REM 2. Verificar pip
echo [2] Verificando pip...
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip no está disponible
    echo.
) else (
    echo [OK] pip está disponible
    pip --version
)
echo.

REM 3. Verificar dependencias
echo [3] Verificando dependencias instaladas...
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo [ADVERTENCIA] FastAPI no está instalado
    echo.
) else (
    echo [OK] FastAPI está instalado
    pip show fastapi | findstr "Version"
)
echo.

REM 4. Verificar estructura de carpetas
echo [4] Verificando estructura de carpetas...
if exist "Backend\app.py" (
    echo [OK] Backend\app.py existe
) else (
    echo [ERROR] Backend\app.py NO existe
)
if exist "Backend\api\routes.py" (
    echo [OK] Backend\api\routes.py existe
) else (
    echo [ERROR] Backend\api\routes.py NO existe
)
if exist "Frontend\index.html" (
    echo [OK] Frontend\index.html existe
) else (
    echo [ERROR] Frontend\index.html NO existe
)
echo.

REM 5. Verificar puerto 8000
echo [5] Verificando puerto 8000...
netstat -an | findstr ":8000" >nul 2>&1
if errorlevel 1 (
    echo [OK] Puerto 8000 está libre
) else (
    echo [ADVERTENCIA] Puerto 8000 está en uso
    echo Puede que el servidor ya esté corriendo
    netstat -ano | findstr ":8000"
)
echo.

REM 6. Probar inicio del servidor
echo [6] ¿Quieres probar iniciar el servidor ahora? (S/N)
set /p respuesta="> "
if /i "%respuesta%"=="S" (
    echo.
    echo Iniciando servidor de prueba...
    echo Presiona Ctrl+C para detenerlo
    echo.
    cd Backend
    python -m uvicorn app:app --host 127.0.0.1 --port 8000
    cd ..
)

echo.
echo ========================================
echo    Diagnóstico completado
echo ========================================
echo.
pause

