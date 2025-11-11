@echo off
REM ========================================
REM    Big Tools - Crear Acceso Directo en Escritorio
REM ========================================

title Big Tools - Crear Acceso Directo

echo.
echo Creando acceso directo en el escritorio...
echo.

REM Obtener la ruta completa del script
set SCRIPT_PATH=%~dp0INICIAR_SISTEMA.bat
set DESKTOP_PATH=%USERPROFILE%\Desktop
set SHORTCUT_PATH=%DESKTOP_PATH%\Big Tools.lnk

REM Crear acceso directo usando PowerShell
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%SCRIPT_PATH%'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'Big Tools - Sistema Experto de Diagnóstico'; $Shortcut.IconLocation = 'shell32.dll,13'; $Shortcut.Save()"

if exist "%SHORTCUT_PATH%" (
    echo.
    echo [OK] Acceso directo creado en el escritorio!
    echo.
    echo Ahora puedes hacer doble clic en "Big Tools" en tu escritorio
    echo para iniciar el sistema.
    echo.
) else (
    echo.
    echo [ERROR] No se pudo crear el acceso directo.
    echo.
)

pause

