@echo off
echo Setting up Firebase deployment structure...

REM Create directories
if not exist "functions" mkdir functions
if not exist "public" mkdir public
if not exist "public\css" mkdir public\css
if not exist "public\js" mkdir public\js
if not exist "public\uploads" mkdir public\uploads

REM Copy static files to public
echo Copying static files...
copy *.html public\ 2>nul
xcopy css public\css\ /E /Y 2>nul
xcopy js public\js\ /E /Y 2>nul
xcopy uploads public\uploads\ /E /Y 2>nul

REM Copy backend files to functions
echo Copying backend files...
copy server-production.js functions\ 2>nul
xcopy routes functions\routes\ /E /Y 2>nul
xcopy models functions\models\ /E /Y 2>nul

echo Setup complete!
echo.
echo Next steps:
echo 1. Set up MongoDB Atlas (see COMPLETE_MIGRATION_GUIDE.md)
echo 2. Update functions/server-production.js with Firebase config
echo 3. Run 'firebase deploy' to deploy
echo.
echo Don't forget to set Firebase environment variables:
echo firebase functions:config:set mongodb.uri="your-atlas-connection-string"
echo firebase functions:config:set session.secret="your-session-secret"

pause
