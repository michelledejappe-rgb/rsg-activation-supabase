@echo off
:: Navigue vers le dossier contenant le fichier batch
cd /d "%~dp0"
echo ==========================================================
echo   RSG QG - SYNCHRONISATION DES ACTUALITES DE LA LICENCE
echo   Date : %date% %time%
echo ==========================================================
echo.

:: Exécute le script node
node update_news.js

echo.
echo ==========================================================
echo   Synchronisation terminee.
echo ==========================================================
