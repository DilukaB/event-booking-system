@echo off
set "ANDROID_HOME=C:\Users\DELL\AppData\Local\Android\Sdk"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%JAVA_HOME%\bin;%PATH%"

echo ====================================================
echo  Starting Metro Bundler for Event Booking App...
echo ====================================================
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5000 tcp:5000

npx react-native start
pause
