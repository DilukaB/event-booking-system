@echo off
set "ANDROID_HOME=C:\Users\DELL\AppData\Local\Android\Sdk"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%JAVA_HOME%\bin;%PATH%"

echo ====================================================
echo Building and running Event Booking App on Android...
echo ====================================================

npx react-native run-android
pause
