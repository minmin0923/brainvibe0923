# 자비스 설치 (Windows). PowerShell에서 실행:
#   powershell -ExecutionPolicy Bypass -File .\install.ps1
# 그래픽카드 없이 설치하려면 뒤에 -Cpu 를 붙인다.
param([switch]$Cpu, [switch]$NoStartup)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
[Console]::OutputEncoding = [Text.Encoding]::UTF8

function Step($msg) { Write-Host "`n== $msg" -ForegroundColor Cyan }

Step "1/6 파이썬 확인"
$py = $null
foreach ($v in @("3.12", "3.11")) {
    try { & py "-$v" --version *> $null; if ($LASTEXITCODE -eq 0) { $py = @("py", "-$v"); break } } catch {}
}
if (-not $py) {
    Write-Host "Python 3.12가 필요합니다. https://www.python.org/downloads/ 에서 설치하고 (Add to PATH 체크) 다시 실행하세요." -ForegroundColor Yellow
    exit 1
}
if (-not (Test-Path .venv)) { & $py[0] $py[1] -m venv .venv }
$vpy = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
& $vpy -m pip install --upgrade pip --quiet

Step "2/6 그래픽카드용 계산 도구(torch) 설치"
if ($Cpu) { & $vpy -m pip install torch --quiet }
else { & $vpy -m pip install torch --index-url https://download.pytorch.org/whl/cu126 --quiet }

Step "3/6 음성 인식, 읽어 주기 도구 설치"
& $vpy -m pip install -r requirements.txt --quiet
try { & $vpy -m pip install -r requirements-optional.txt --quiet } catch { Write-Host "선택 도구 일부를 설치하지 못했습니다. 기본 기능은 그대로 됩니다." -ForegroundColor Yellow }

Step "4/6 설정 파일 만들기"
if (-not (Test-Path config.yaml)) {
    Copy-Item config.example.yaml config.yaml
    if ($Cpu) { (Get-Content config.yaml -Raw -Encoding UTF8) -replace "model: large-v3-turbo", "model: small" -replace "device: cuda", "device: cpu" -replace "compute_type: float16", "compute_type: int8" | Set-Content config.yaml -Encoding UTF8 }
    Write-Host "config.yaml을 만들었습니다. 마이크 이름 등은 여기서 바꿉니다."
} else { Write-Host "config.yaml이 이미 있어 그대로 둡니다." }

Step "5/6 음성 인식 모델 내려받기 (처음 한 번, 약 1.5GB)"
$model = if ($Cpu) { "small" } else { "large-v3-turbo" }
& $vpy -c "from faster_whisper import download_model; download_model('$model'); print('완료')"
& $vpy -c "import torch; print('그래픽카드 사용 가능:', torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else '')"

Step "6/6 Claude Code 확인, 자동 시작 등록"
if (Get-Command claude -ErrorAction SilentlyContinue) { Write-Host "Claude Code 찾음: $((Get-Command claude).Source)" }
else {
    Write-Host "Claude Code가 없습니다. 아래 명령으로 설치한 뒤 claude 를 한 번 실행해 로그인하세요:" -ForegroundColor Yellow
    Write-Host "  irm https://claude.ai/install.ps1 | iex"
}
$shell = New-Object -ComObject WScript.Shell
$pyw = Join-Path $PSScriptRoot ".venv\Scripts\pythonw.exe"
$targets = @([Environment]::GetFolderPath("Desktop"))
if (-not $NoStartup) { $targets += [Environment]::GetFolderPath("Startup") }
foreach ($dir in $targets) {
    $lnk = $shell.CreateShortcut((Join-Path $dir "자비스.lnk"))
    $lnk.TargetPath = $pyw
    $lnk.Arguments = "-m jarvis"
    $lnk.WorkingDirectory = $PSScriptRoot
    $lnk.Description = "자비스 음성 비서"
    $lnk.Save()
}
Write-Host "바탕화면에 '자비스' 바로가기를 만들었습니다." -NoNewline
if (-not $NoStartup) { Write-Host " Windows에 로그인하면 자동으로 켜집니다." } else { Write-Host "" }

Write-Host "`n설치 끝. 다음 순서로 맞춰 보세요:" -ForegroundColor Green
Write-Host "  1) .\.venv\Scripts\python -m jarvis --calibrate   (마이크 기준 소리 크기 재기)"
Write-Host "  2) .\.venv\Scripts\python -m jarvis               (시작. 창이 뜨면 '자비스, 몇 시야?' 라고 말해 보기)"
