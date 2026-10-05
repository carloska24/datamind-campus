@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Instale o Node.js 22.12 ou mais recente antes de iniciar.
 echo Download: https://nodejs.org/
 pause
 exit /b 1
)
echo.
echo DataMind - Aula 01 com narracao em Portugues
if not exist "dist\index.html" (
 echo Versao compilada ausente. Execute npm ci e npm run build.
 pause
 exit /b 1
)
echo Abrindo http://127.0.0.1:4173
start "" "http://127.0.0.1:4173"
node server\index.mjs
pause
