# PluginLabs Tasarım Skill Paketi · 30.10.2026

Claude Code ve Codex'in **ortak** kullandığı PluginLabs tasarım sistemi skill'i.

| Klasör | Ne |
|---|---|
| `pluginlabs-design/` | Kanonik skill (Agent Skills standardı: `SKILL.md` + references + assets + build) |
| `hazir/.claude/skills/` | Claude Code için kuruluma hazır kopya |
| `hazir/.agents/skills/` | Codex için kuruluma hazır kopya (`agents/openai.yaml` dahil) |
| `kurulum/` | `kur.sh` (WSL/Linux/macOS), `kur.ps1` (Windows), `AGENTS.md` / `CLAUDE.md` parçaları |

## Hızlı kurulum
```bash
bash kurulum/kur.sh /yol/PluginLabs          # kopya
KIP=symlink bash kurulum/kur.sh /yol/PluginLabs   # tek kaynak (sembolik bağ)
```
Sonra `kurulum/AGENTS.md.parca` → repo kökündeki `AGENTS.md`'ye, `kurulum/CLAUDE.md.parca` → `CLAUDE.md`'ye eklenir.
Kurulum mevcut sürümleri **silmez**, `_arsiv/GG.AA.YYYY/` altına taşır.

## Kişisel (tüm projeler) kurulum
- Claude Code: `~/.claude/skills/pluginlabs-design/`
- Codex: `~/.agents/skills/pluginlabs-design/`

## Güncelleme
`pluginlabs-design/build/components.py` düzenle → `python3 pluginlabs-design/build/build.py` → `kur.sh` ile eşitle.
