@echo off
chcp 65001 >nul
title May Chu Giong Doc AI Kokoro - DocTruyen.VIP
cd /d "%~dp0"
cls
echo ========================================================================
echo   KHOI DONG HE THONG GIONG DOC AI KOKORO - DOCTRUYEN.VIP
echo ========================================================================
"C:\zooreup\Zoo Reup Studio\data\runtime\python-embed\install\python.exe" scripts\run_ai_pipeline.py
pause
