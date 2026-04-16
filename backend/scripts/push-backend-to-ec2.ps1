# Run from Windows PowerShell: packs backend (no node_modules), uploads to EC2.
# Example:
#   cd backend\scripts
#   .\push-backend-to-ec2.ps1 -Ec2Host "3.109.60.91" -KeyFile "$env:USERPROFILE\.ssh\my-key.pem"

param(
    [Parameter(Mandatory = $true)]
    [string] $Ec2Host,
    [Parameter(Mandatory = $true)]
    [string] $KeyFile,
    [string] $Ec2User = "ec2-user",
    [string] $RemoteArchive = "/home/ec2-user/telehealth-backend.tgz"
)

$ErrorActionPreference = "Stop"
$BackendRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if (-not (Test-Path -LiteralPath $KeyFile)) {
    throw "Key file not found: $KeyFile"
}

$tgz = Join-Path ([System.IO.Path]::GetTempPath()) ("telehealth-backend-" + [Guid]::NewGuid().ToString("n") + ".tgz")
Push-Location $BackendRoot
try {
    tar -czf $tgz --exclude=node_modules --exclude=.git .
}
finally {
    Pop-Location
}

Write-Host "Uploading archive to ${Ec2User}@${Ec2Host}:$RemoteArchive ..."
scp -i $KeyFile -o StrictHostKeyChecking=accept-new $tgz "${Ec2User}@${Ec2Host}:${RemoteArchive}"
Remove-Item -Force $tgz

Write-Host @"

Done. On EC2 run:

  mkdir -p ~/backend && cd ~/backend
  tar -xzf /home/ec2-user/telehealth-backend.tgz && rm /home/ec2-user/telehealth-backend.tgz
  chmod +x scripts/ec2-install.sh && ./scripts/ec2-install.sh

(Ensure .env exists in ~/backend before ec2-install.sh — copy from .env.example on the server.)

"@
