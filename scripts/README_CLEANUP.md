# Scripts de Limpeza e Otimização

## 🚀 Uso Rápido

### Limpeza Rápida (Sem remover node_modules)
```bash
pnpm run clean:quick
```
Remove: logs, temporários, coverage, relatórios ESLint
Tempo: ~5 segundos

### Limpeza Completa (Inclui node_modules)
```bash
pnpm run clean
```
Remove: node_modules, dist, logs, temporários, caches
Tempo: ~2-3 minutos (inclui reinstalação)
Libera: ~400-500 MB

## 📋 O Que Cada Script Faz

### `cleanup_safe.ps1` (Limpeza Completa)
1. ✅ Remove node_modules completamente
2. ✅ Remove pasta dist (builds)
3. ✅ Limpa todos os *.log
4. ✅ Remove arquivos temp*.*, tmp*.*
5. ✅ Remove arquivos .codex_*
6. ✅ Limpa pasta coverage
7. ✅ Remove eslint-report.json
8. ✅ Limpa cache do Vercel
9. ✅ Reinstala dependências limpas

### `quick_clean.ps1` (Limpeza Rápida)
1. ✅ Limpa apenas *.log
2. ✅ Remove temp*.*, tmp*.*
3. ✅ Remove .codex_*
4. ✅ Limpa coverage
5. ✅ Remove eslint-report.json
6. ⏭️ **NÃO remove** node_modules (mais rápido)

## 🎯 Quando Usar Cada Um

### Use `clean:quick` quando:
- Computador está lento mas não crítico
- Precisa limpar logs rapidamente
- Não quer esperar reinstalação de dependências
- Execução diária/semanal de manutenção

### Use `clean` quando:
- Computador muito lento
- Erros estranhos no build
- Após atualizar dependências
- Problemas com node_modules corrompido
- Limpeza mensal profunda

## 🔄 Frequência Recomendada

- **Diária**: Não necessário
- **Semanal**: `pnpm run clean:quick`
- **Mensal**: `pnpm run clean`
- **Quando Necessário**: `pnpm run clean` se houver problemas

## 💾 Espaço Típico Liberado

| Script | Espaço Liberado | Tempo |
|--------|----------------|-------|
| quick_clean | ~5-20 MB | 5s |
| cleanup_safe | ~400-500 MB | 2-3min |

## ⚙️ Configurações do VS Code

Otimizações já aplicadas em `.vscode/settings.json`:

```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/*.log": true
  },
  "typescript.tsserver.maxTsServerMemory": 4096,
  "git.autorefresh": false,
  "telemetry.telemetryLevel": "off"
}
```

## 🛠️ Troubleshooting

### Erro: "Não é possível remover o item"
**Causa**: Arquivo/pasta em uso por outro processo
**Solução**:
1. Feche VS Code completamente
2. Feche qualquer terminal rodando `pnpm dev`
3. Execute o script novamente

### Script não executa
**Causa**: Política de execução do PowerShell
**Solução**:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Node_modules não reinstala
**Causa**: pnpm não encontrado ou erro de rede
**Solução**:
```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Ou executar manualmente
pnpm install
```

## 📚 Guia Completo

Para mais otimizações de Windows e VS Code, veja:
`docs/PERFORMANCE_OPTIMIZATION_GUIDE.md`

## 🔍 Verificar Espaço em Disco

```powershell
# Ver espaço livre
Get-PSDrive C | Select-Object Used,Free

# Ver tamanho de pastas grandes
Get-ChildItem -Directory | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    [PSCustomObject]@{
        Folder = $_.Name
        SizeMB = [math]::Round($size, 2)
    }
} | Sort-Object SizeMB -Descending | Select-Object -First 10
```

## ✅ Checklist Pós-Limpeza

Após executar limpeza completa:

- [ ] Reiniciar VS Code (Ctrl+Shift+P > Reload Window)
- [ ] Verificar que `pnpm dev` funciona
- [ ] Testar build: `pnpm build`
- [ ] Confirmar que testes rodam: `pnpm test`

## 🎁 Bônus: Aliases Úteis

Adicione ao seu PowerShell profile:

```powershell
# Abrir profile
notepad $PROFILE

# Adicionar aliases
function Clean-Project { pnpm run clean }
function Quick-Clean { pnpm run clean:quick }

Set-Alias clean Clean-Project
Set-Alias qclean Quick-Clean
```

Agora você pode usar:
```bash
clean        # = pnpm run clean
qclean       # = pnpm run clean:quick
```

---

**Última atualização**: 13/11/2025
**Espaço liberado na última execução**: ~414 MB
