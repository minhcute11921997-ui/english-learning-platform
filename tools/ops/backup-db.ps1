param(
  [string]$BackupDir = ".\backups\mysql",
  [int]$RetentionDays = 14,
  [string]$ContainerName = "englearn_mysql",
  [string]$DbName = $(if ($env:DB_NAME) { $env:DB_NAME } else { "english_learning" }),
  [string]$DbUser = "root",
  [string]$DbPassword = $(if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { $env:DB_PASSWORD })
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$sqlFile = Join-Path $BackupDir "$DbName`_$timestamp.sql"
$zipFile = "$sqlFile.zip"

$running = docker ps --format "{{.Names}}" 2>$null
if ($running -contains $ContainerName) {
  Write-Host "Đang sao lưu từ Docker container '$ContainerName'..."
  docker exec $ContainerName mysqldump -u"$DbUser" -p"$DbPassword" --single-transaction --routines --triggers --databases $DbName | Out-File -FilePath $sqlFile -Encoding utf8
} else {
  Write-Host "Đang sao lưu trực tiếp từ MySQL host..."
  $dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "127.0.0.1" }
  $dbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }
  mysqldump -h $dbHost -P $dbPort -u"$DbUser" -p"$DbPassword" --single-transaction --routines --triggers --databases $DbName | Out-File -FilePath $sqlFile -Encoding utf8
}

Compress-Archive -Path $sqlFile -DestinationPath $zipFile -Force
Remove-Item -Path $sqlFile -Force
Write-Host "Đã tạo bản sao lưu: $zipFile"

$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "$DbName`_*.sql.zip" | Where-Object { $_.LastWriteTime -lt $cutoff } | Remove-Item -Force
Write-Host "Đã dọn các bản sao lưu cũ hơn $RetentionDays ngày."
