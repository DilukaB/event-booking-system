@echo off
set "ANDROID_HOME=C:\Users\DELL\AppData\Local\Android\Sdk"
set "ANDROID_SDK_ROOT=C:\Users\DELL\AppData\Local\Android\Sdk"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%JAVA_HOME%\bin;%PATH%"

echo ====================================================
echo  Configuring reverse ports for Android Emulator...
echo ====================================================
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5000 tcp:5000

echo ====================================================
echo  Building and running Event Booking App on Android...
echo ====================================================

npx react-native run-android
pause

