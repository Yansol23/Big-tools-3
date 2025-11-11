@echo off
REM ========================================
REM    Big Tools - Iniciar Sistema (Versión Simple)
REM ========================================

title Big Tools - Sistema Experto

REM Cambiar al directorio del script
cd /d "%~dp0"

echo.
echo ========================================
echo    Big Tools - Iniciando Sistema
echo ========================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no encontrado. Por favor instala Python.
    pause
    exit /b 1
)

REM Verificar dependencias
echo Verificando dependencias...
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo Instalando dependencias...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
)

echo.
echo Iniciando servidor...
echo.

REM Cambiar a la carpeta Backend e iniciar el servidor
cd Backend
start "Big Tools - Servidor" cmd /k "python -m uvicorn app:app --host 0.0.0.0 --port 8000"

REM Volver al directorio raíz
cd ..

REM Esperar a que el servidor inicie
echo Esperando a que el servidor inicie...
timeout /t 6 /nobreak >nul

echo.
echo Abriendo navegador...
start "" "http://127.0.0.1:8000"

echo.
echo ========================================
echo    Sistema iniciado!
echo ========================================
echo.
echo El servidor está corriendo en: http://127.0.0.1:8000
echo.
echo Credenciales:
echo   Usuario: admin
echo   Contraseña: 1234
echo.
echo IMPORTANTE: No cierres la ventana "Big Tools - Servidor"
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
echo (El servidor seguirá corriendo en la otra ventana)
pause >nul

