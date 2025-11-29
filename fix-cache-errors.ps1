# Script khắc phục lỗi Webpack Cache và 500 Errors
# Chạy script này trong PowerShell: .\fix-cache-errors.ps1

Write-Host "🔧 Đang khắc phục lỗi cache và build..." -ForegroundColor Cyan

# Bước 1: Dừng các process Node.js đang chạy
Write-Host "`n📌 Bước 1: Dừng các process Node.js..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Bước 2: Xóa thư mục .next
Write-Host "`n📌 Bước 2: Xóa thư mục .next..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "✅ Đã xóa thư mục .next" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Thư mục .next không tồn tại" -ForegroundColor Gray
}

# Bước 3: Xóa node_modules/.cache
Write-Host "`n📌 Bước 3: Xóa node_modules/.cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
    Write-Host "✅ Đã xóa node_modules/.cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Thư mục node_modules/.cache không tồn tại" -ForegroundColor Gray
}

# Bước 4: Xóa webpack cache trong .next/cache
Write-Host "`n📌 Bước 4: Xóa webpack cache..." -ForegroundColor Yellow
if (Test-Path ".next\cache") {
    Remove-Item -Recurse -Force ".next\cache" -ErrorAction SilentlyContinue
    Write-Host "✅ Đã xóa webpack cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Thư mục .next/cache không tồn tại" -ForegroundColor Gray
}

# Bước 5: Kiểm tra quyền truy cập
Write-Host "`n📌 Bước 5: Kiểm tra quyền truy cập thư mục..." -ForegroundColor Yellow
$currentPath = Get-Location
try {
    $acl = Get-Acl $currentPath
    Write-Host "✅ Quyền truy cập OK" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Có vấn đề với quyền truy cập: $_" -ForegroundColor Yellow
}

# Bước 6: Hỏi có muốn clean install không
Write-Host "`n❓ Bạn có muốn clean install dependencies? (y/n)" -ForegroundColor Cyan
$cleanInstall = Read-Host
if ($cleanInstall -eq "y" -or $cleanInstall -eq "Y") {
    Write-Host "`n📌 Đang xóa node_modules và package-lock.json..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    }
    if (Test-Path "package-lock.json") {
        Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
    }
    Write-Host "✅ Đã xóa node_modules và package-lock.json" -ForegroundColor Green
    
    Write-Host "`n📌 Đang cài đặt lại dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Đã cài đặt dependencies thành công" -ForegroundColor Green
    } else {
        Write-Host "❌ Lỗi khi cài đặt dependencies" -ForegroundColor Red
        exit 1
    }
}

# Bước 7: Build lại project
Write-Host "`n❓ Bạn có muốn build project ngay bây giờ? (y/n)" -ForegroundColor Cyan
$buildNow = Read-Host
if ($buildNow -eq "y" -or $buildNow -eq "Y") {
    Write-Host "`n📌 Đang build project..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build thành công!" -ForegroundColor Green
    } else {
        Write-Host "❌ Build thất bại" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✅ Hoàn tất! Bây giờ bạn có thể chạy 'npm run dev' để khởi động lại dev server." -ForegroundColor Green
Write-Host "`n💡 Lưu ý: Nếu vẫn gặp lỗi, hãy thử:" -ForegroundColor Yellow
Write-Host "   1. Tắt antivirus/Windows Defender tạm thời" -ForegroundColor Gray
Write-Host "   2. Chạy PowerShell với quyền Administrator" -ForegroundColor Gray
Write-Host "   3. Kiểm tra disk space còn đủ không" -ForegroundColor Gray

