' Script VBS para ejecutar el sistema sin mostrar ventana de consola
' Crea un acceso directo a este archivo en el escritorio para iniciar el sistema

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obtener la ruta del script
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = scriptPath & "\INICIAR_SISTEMA.bat"

' Ejecutar el script .bat
WshShell.Run """" & batPath & """", 1, False

' Cerrar este script
WScript.Quit

