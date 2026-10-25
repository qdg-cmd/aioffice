@echo off
rem aioffice launcher for the packaged Windows app: <install>\resources\cli\aioffice.cmd
setlocal
set ELECTRON_RUN_AS_NODE=1
"%~dp0..\..\AIOffice.exe" "%~dp0genoffice.cjs" %*
endlocal
