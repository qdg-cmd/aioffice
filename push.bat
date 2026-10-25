@echo off
chcp 65001 > nul
echo [AIOffice] GitHub 리포지토리로 코드를 푸시합니다...
git push -u origin main
if %errorlevel% equ 0 (
    echo.
    echo [성공] GitHub 푸시가 완료되었습니다!
    echo GitHub 리포지토리 Settings -> Pages에서 Source를 'GitHub Actions'로 선택하시면 배포가 완료됩니다.
) else (
    echo.
    echo [안내] GitHub에 'aioffice' 리포지토리가 생성되어 있는지 확인해 주세요.
    echo https://github.com/new 에서 'aioffice' 이름으로 리포지토리를 먼저 생성하시면 됩니다.
)
pause
