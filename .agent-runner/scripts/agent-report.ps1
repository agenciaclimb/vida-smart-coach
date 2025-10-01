Param(
  [string]$LogPath = ".agent/out/log.txt",
  [string]$OutputsDir = "agent_outputs"
)

if (Test-Path $LogPath) {
  Write-Host "[report] Entradas recentes do log:"
  Get-Content $LogPath | Select-Object -Last 40 | ForEach-Object {
    if ($_ -match 'Falha' -or $_ -match 'Erro') {
      Write-Host $_ -ForegroundColor Red
    }
    else {
      Write-Host $_
    }
  }
}
else {
  Write-Host "[report] Log nao encontrado em $LogPath"
}

if (Test-Path $OutputsDir) {
  Write-Host "[report] Arquivos recentes em ${OutputsDir}:"
  Get-ChildItem $OutputsDir | Sort-Object LastWriteTime -Descending | Select-Object -First 10 |
    ForEach-Object {
      $ts = $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm')
      Write-Host (" - {0} `t{1}" -f $ts, $_.Name)
    }
}
else {
  Write-Host "[report] Diretorio ${OutputsDir} nao encontrado"
}
