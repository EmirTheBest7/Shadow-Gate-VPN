Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c ""C:\Tor\tor\start-vpn.bat""", 0, False
Set WshShell = Nothing