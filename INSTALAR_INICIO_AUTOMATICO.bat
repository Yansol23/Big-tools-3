@echo off
REM ========================================
REM    Big Tools - Instalar Inicio Automático
REM    Configura el sistema para iniciar automáticamente con Windows
REM ========================================

title Big Tools - Instalar Inicio Automático

echo.
echo ========================================
echo    Configurando Inicio Automático
echo ========================================
echo.

REM Obtener la ruta completa del script
set SCRIPT_PATH=%~dp0INICIAR_SISTEMA.bat
set SCRIPT_PATH=%SCRIPT_PATH:\=\\%

REM Obtener la ruta de inicio automático
set STARTUP_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_PATH%\Big Tools.lnk

echo Creando acceso directo en inicio automático...
echo.

REM Crear acceso directo usando PowerShell
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%SCRIPT_PATH%'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'Big Tools - Sistema Experto'; $Shortcut.Save()"

if exist "%SHORTCUT_PATH%" (
    echo.
    echo [OK] Inicio automático configurado correctamente!
    echo.
    echo El sistema se iniciará automáticamente cuando Windows inicie.
    echo.
    echo Para desinstalar el inicio automático, elimina el archivo:
    echo %SHORTCUT_PATH%
    echo.
) else (
    echo.
    echo [ERROR] No se pudo crear el acceso directo.
    echo Por favor ejecuta este script como Administrador.
    echo.
)

pause

