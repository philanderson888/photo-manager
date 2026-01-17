@echo off
echo =====================================
echo Building Rust EXIF Updater
echo =====================================
echo.

cd rust

echo Checking Rust installation...
rustc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Rust is not installed!
    echo Please visit https://rustup.rs/ to install Rust.
    pause
    exit /b 1
)

echo.
echo Rust found! Building release binary...
echo This may take a few minutes on first build...
echo.

cargo build --release

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo =====================================
echo Build successful!
echo =====================================
echo.
echo Binary location: rust\target\release\exif-updater.exe
echo You can now run: npm start
echo.
pause
