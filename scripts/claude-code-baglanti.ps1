<#
.SYNOPSIS
  Codex'teki PL-001–PL-053 projelerinin Claude Code karşılığını kurar.

.DESCRIPTION
  Her proje klasörü için:
    1. .claude\settings.local.json -> permissions.additionalDirectories listesine PluginLabs kökünü ekler
       (Codex'teki "ikinci klasör: PluginLabs" ayarının Claude Code karşılığı).
    2. CLAUDE.md yoksa oluşturur: klasörde AGENTS.md varsa "@AGENTS.md", yoksa PluginLabs AGENTS.md'sini içe aktarır.
  Var olan dosyaların üzerine yazmaz; settings.local.json değişmeden önce tarihli yedeği alınır.
  Varsayılan kuru çalıştırmadır (hiçbir dosya yazılmaz). Değişiklik için -Uygula verin.
  Her işlem logs\claude-code-baglanti GG.AA.YYYY.csv dosyasına yazılır.

.PARAMETER Eslesme
  Proje -> yerel klasör eşlemesi (git'e girmez). Biçim: registry\local-paths.example.json

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\claude-code-baglanti.ps1
  powershell -ExecutionPolicy Bypass -File scripts\claude-code-baglanti.ps1 -Uygula
#>
param(
  [string]$Eslesme = (Join-Path $PSScriptRoot '..\registry\local-paths.json'),
  [switch]$Uygula
)
$ErrorActionPreference = 'Stop'
$repoKok = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$tarih = Get-Date -Format 'dd.MM.yyyy'
$logKlasor = Join-Path $repoKok 'logs'
$logDosya = Join-Path $logKlasor "claude-code-baglanti $tarih.csv"
$kayitlar = New-Object System.Collections.Generic.List[object]

function Log($id, $hedef, $islem, $sonuc) {
  $kayitlar.Add([pscustomobject]@{ Zaman = (Get-Date -Format 's'); Proje = $id; Hedef = $hedef; Islem = $islem; Sonuc = $sonuc })
  Write-Host ("[{0}] {1,-7} {2,-28} {3}" -f ($(if ($Uygula) { 'UYGULA' } else { 'KURU' })), $id, $islem, $sonuc)
}

if (-not (Test-Path $Eslesme)) { throw "Eşleme dosyası bulunamadı: $Eslesme  (registry\local-paths.example.json dosyasını kopyalayıp doldurun)" }
$map = Get-Content $Eslesme -Raw -Encoding UTF8 | ConvertFrom-Json
$plKok = $map.pluginlabsRoot
if (-not (Test-Path $plKok)) { throw "PluginLabs kökü bulunamadı: $plKok" }
$plKok = (Resolve-Path $plKok).Path
$registry = Get-Content (Join-Path $repoKok 'registry\projects.json') -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($p in $registry.projects) {
  $id = $p.id
  $yol = $map.projects.$id
  if (-not $yol) { Log $id '-' 'eşleme' 'EKSİK: local-paths.json içinde yol yok'; continue }
  if (-not (Test-Path $yol)) { Log $id $yol 'klasör' 'EKSİK: klasör bulunamadı'; continue }
  $yol = (Resolve-Path $yol).Path

  # 1) additionalDirectories
  $claudeKlasor = Join-Path $yol '.claude'
  $ayar = Join-Path $claudeKlasor 'settings.local.json'
  $obj = $null
  if (Test-Path $ayar) {
    $obj = Get-Content $ayar -Raw -Encoding UTF8 | ConvertFrom-Json
  } else {
    $obj = [pscustomobject]@{}
  }
  if (-not ($obj.PSObject.Properties.Name -contains 'permissions')) { $obj | Add-Member -NotePropertyName permissions -NotePropertyValue ([pscustomobject]@{}) }
  if (-not ($obj.permissions.PSObject.Properties.Name -contains 'additionalDirectories')) { $obj.permissions | Add-Member -NotePropertyName additionalDirectories -NotePropertyValue @() }
  $liste = @($obj.permissions.additionalDirectories)
  if ($yol -eq $plKok) {
    Log $id $ayar 'additionalDirectories' 'ATLANDI: proje klasörü PluginLabs köküyle aynı'
  } elseif ($liste -contains $plKok) {
    Log $id $ayar 'additionalDirectories' 'ZATEN VAR'
  } else {
    $obj.permissions.additionalDirectories = @($liste + $plKok)
    if ($Uygula) {
      if (-not (Test-Path $claudeKlasor)) { New-Item -ItemType Directory -Path $claudeKlasor | Out-Null }
      if (Test-Path $ayar) { Copy-Item $ayar (Join-Path $claudeKlasor "settings.local.yedek-$tarih.json") -Force }
      $json = $obj | ConvertTo-Json -Depth 20
      [System.IO.File]::WriteAllText($ayar, $json, (New-Object System.Text.UTF8Encoding($false)))
    }
    Log $id $ayar 'additionalDirectories' "EKLENDİ: $plKok"
  }

  # 2) CLAUDE.md
  $claudeMd = Join-Path $yol 'CLAUDE.md'
  if (Test-Path $claudeMd) {
    Log $id $claudeMd 'CLAUDE.md' 'ZATEN VAR (dokunulmadı)'
  } else {
    if (Test-Path (Join-Path $yol 'AGENTS.md')) {
      $icerik = "# $($p.id) · $($p.name) — Claude Code`n`nKurallar AGENTS.md içindedir (Codex ile ortak).`n`n@AGENTS.md`n`nPluginLabs ortak çalışma protokolü: @$($plKok -replace '\\','/')/docs/ortak-calisma/AI-ORTAK-CALISMA.md`n"
    } else {
      $icerik = "# $($p.id) · $($p.name) — Claude Code`n`nBu proje PluginLabs kurallarıyla geliştirilir (Codex ile ortak).`n`n@$($plKok -replace '\\','/')/AGENTS.md`n`nProje kartı: @$($plKok -replace '\\','/')/$($p.appPath)/README.md`n"
    }
    if ($Uygula) { [System.IO.File]::WriteAllText($claudeMd, $icerik, (New-Object System.Text.UTF8Encoding($false))) }
    Log $id $claudeMd 'CLAUDE.md' 'OLUŞTURULDU'
  }
}

if (-not (Test-Path $logKlasor)) { New-Item -ItemType Directory -Path $logKlasor | Out-Null }
$kayitlar | Export-Csv -Path $logDosya -NoTypeInformation -Encoding UTF8
Write-Host "`nLog: $logDosya"
if (-not $Uygula) { Write-Host 'Kuru çalıştırma tamamlandı. Değişiklikleri yazmak için -Uygula ile tekrar çalıştırın.' }
