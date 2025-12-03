# Guia de Otimização de Desempenho - Windows

## ✅ Limpeza Realizada no Projeto

- **Espaço Liberado**: ~414 MB
- **Itens Removidos**:
  - node_modules (reinstalado limpo)
  - Builds antigos (dist)
  - Logs (~22 KB)
  - Arquivos temporários (~15 KB)
  - Cache do Codex (~5 KB)
  - Cache Vercel

## 🚀 Otimizações Adicionais do Windows

### 1. Limpeza de Disco do Windows

Execute o limpador de disco nativo do Windows:

```powershell
# Abrir Limpeza de Disco
cleanmgr /d C:

# Ou via Configurações:
# Configurações > Sistema > Armazenamento > Arquivos Temporários
```

**Itens para Limpar**:
- ✅ Arquivos temporários da Internet
- ✅ Downloads
- ✅ Lixeira
- ✅ Arquivos de log do Windows
- ✅ Miniaturas
- ✅ Arquivos de otimização de entrega

### 2. Liberar Espaço com Storage Sense

```powershell
# Ativar Storage Sense
# Configurações > Sistema > Armazenamento > Ativar Sensor de Armazenamento
```

### 3. Desabilitar Programas de Inicialização

```powershell
# Abrir Gerenciador de Tarefas
Ctrl + Shift + Esc

# Ir para aba "Inicializar"
# Desabilitar programas desnecessários (Discord, Spotify, etc)
```

### 4. Limpar Cache do VS Code

```powershell
# Fechar VS Code completamente, depois executar:
Remove-Item -Recurse -Force "$env:APPDATA\Code\Cache"
Remove-Item -Recurse -Force "$env:APPDATA\Code\CachedData"
Remove-Item -Recurse -Force "$env:APPDATA\Code\Code Cache"
Remove-Item -Recurse -Force "$env:APPDATA\Code\GPUCache"
```

### 5. Limpar Cache do NPM/PNPM

```powershell
# Limpar cache do pnpm
pnpm store prune

# Limpar cache do npm (se usado)
npm cache clean --force
```

### 6. Desativar Efeitos Visuais

```
Configurações > Sistema > Sobre > Configurações avançadas do sistema
> Desempenho > Configurações > Ajustar para obter um melhor desempenho
```

### 7. Aumentar Memória Virtual

```
Painel de Controle > Sistema > Configurações avançadas
> Desempenho > Configurações > Avançado > Memória virtual > Alterar

Recomendado: 1.5x a RAM física
Exemplo: 8GB RAM = 12GB memória virtual (12288 MB)
```

### 8. Desabilitar Indexação de Arquivos

```
C:\ > Propriedades > Desmarcar "Permitir que os arquivos nesta unidade tenham conteúdo indexado"
```

### 9. Executar Desfragmentação (apenas HDD, não SSD!)

```powershell
# Verificar tipo de disco primeiro
Get-PhysicalDisk | Select FriendlyName, MediaType

# Se for HDD, desfragmentar:
Optimize-Volume -DriveLetter C -Defrag -Verbose

# Se for SSD, usar TRIM:
Optimize-Volume -DriveLetter C -ReTrim -Verbose
```

### 10. Limpar Arquivos do Windows Update

```powershell
# Parar serviço Windows Update
Stop-Service -Name wuauserv -Force

# Limpar pasta SoftwareDistribution
Remove-Item -Recurse -Force "C:\Windows\SoftwareDistribution\Download\*"

# Reiniciar serviço
Start-Service -Name wuauserv
```

## 🔧 Otimizações do VS Code (Já Aplicadas)

As seguintes otimizações já foram aplicadas em `.vscode/settings.json`:

- ✅ Exclusão de node_modules, dist, logs dos watchers
- ✅ TypeScript Server com 4GB de memória máxima
- ✅ Desabilitar project diagnostics
- ✅ Git autorefresh desabilitado
- ✅ Telemetria desabilitada
- ✅ Auto-save em onFocusChange

## 📊 Monitoramento de Desempenho

### Ver Uso de Memória no Windows

```powershell
# CPU e Memória em tempo real
Get-Process | Sort-Object -Property CPU -Descending | Select-Object -First 10

# Uso de disco
Get-PSDrive C | Select-Object Used,Free
```

### Ver Processos do Node/VS Code

```powershell
# Processos Node.js
Get-Process node* | Select-Object Id, ProcessName, CPU, WS -AutoSize

# Processos VS Code
Get-Process Code* | Select-Object Id, ProcessName, CPU, WS -AutoSize
```

## 🎯 Checklist Rápido de Performance

### Diário:
- [ ] Fechar abas não utilizadas no VS Code
- [ ] Fechar aplicativos em segundo plano
- [ ] Limpar downloads e arquivos temporários

### Semanal:
- [ ] Executar script de limpeza do projeto
- [ ] Limpar cache do navegador
- [ ] Verificar uso de disco (Storage Sense)

### Mensal:
- [ ] Desfragmentar HDD (ou TRIM em SSD)
- [ ] Limpar cache do VS Code
- [ ] Revisar programas de inicialização
- [ ] Verificar atualizações do Windows

## 🚨 Sinais de Que Precisa Limpeza

- VS Code lento ao abrir arquivos
- Terminal demorando para executar comandos
- Disco C: com menos de 10GB livre
- Múltiplos processos node.js rodando
- Ventilador do computador constantemente acelerado

## 💡 Dicas Específicas para Desenvolvimento

### 1. Limitar Watchers do Vite

Adicione ao `vite.config.js`:

```javascript
export default {
  server: {
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**']
    }
  }
}
```

### 2. Usar .gitignore para Build Artifacts

Já configurado, mas sempre verificar:
- node_modules/
- dist/
- .cache/
- coverage/
- *.log

### 3. Periodicamente Reinstalar Dependências

```powershell
# A cada 2-3 semanas:
Remove-Item -Recurse -Force node_modules
pnpm install
```

## 📈 Espera de Resultados

Após aplicar todas as otimizações:

- **Inicialização do VS Code**: 2-5 segundos (vs 10-20s antes)
- **Hot reload do Vite**: <1 segundo
- **Build de produção**: 30-60 segundos
- **Uso de RAM do VS Code**: 500MB-1GB (vs 2-3GB antes)
- **Espaço em disco livre**: +10-20GB

## 🛠 Script de Manutenção Automática

Para executar limpeza regular:

```powershell
# Criar tarefa agendada (semanal)
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-File "c:\Users\JE\vida-smart-coach\scripts\cleanup_safe.ps1"'
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "VidaSmartCoach-Cleanup" -Description "Limpeza semanal do projeto"
```

## ✅ Status Atual

- **Projeto**: Limpo e otimizado ✅
- **VS Code**: Configurado para performance ✅
- **Dependencies**: Reinstaladas (1011 packages) ✅
- **Espaço liberado**: ~414 MB ✅

---

**Próximos Passos Recomendados**:
1. Reiniciar VS Code (Ctrl+Shift+P > "Reload Window")
2. Executar limpeza do Windows (Storage Sense)
3. Verificar programas de inicialização
4. Considerar upgrade de RAM se <8GB
