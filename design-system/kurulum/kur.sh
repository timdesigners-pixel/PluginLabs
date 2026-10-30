#!/usr/bin/env bash
# PluginLabs tasarım skill'ini bir repoya kurar / eşitler (Linux, macOS, WSL).
# Kullanım: bash kur.sh <repo-kökü>   (varsayılan: bulunduğun dizin)
#   KIP=symlink bash kur.sh .         → kopya yerine sembolik bağ (tek kaynak)
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${1:-$PWD}"
SRC="$HERE/pluginlabs-design"
KANON="$REPO/design-system/pluginlabs-design"
TARIH="$(date +%d.%m.%Y)"
log(){ echo "[$(date +%H:%M:%S)] $*"; }

mkdir -p "$REPO/design-system" "$REPO/.claude/skills" "$REPO/.agents/skills"
# 1) Kanonik kopya (eskisi varsa arşivle, silme)
if [ -d "$KANON" ] && [ "$SRC" != "$KANON" ]; then
  mkdir -p "$REPO/design-system/_arsiv/$TARIH"; mv "$KANON" "$REPO/design-system/_arsiv/$TARIH/pluginlabs-design-$(date +%H%M%S)"
  log "Eski kanonik sürüm arşivlendi → design-system/_arsiv/$TARIH/"
fi
[ "$SRC" != "$KANON" ] && cp -R "$SRC" "$KANON" && log "Kanonik kaynak → $KANON"

# 2) Claude Code + Codex konumları
for HEDEF in "$REPO/.claude/skills/pluginlabs-design" "$REPO/.agents/skills/pluginlabs-design"; do
  if [ -e "$HEDEF" ] || [ -L "$HEDEF" ]; then
    # Arşiv skill klasörlerinin DIŞINDA tutulur (ajanlar eski kopyayı ikinci skill sanmasın)
    AR="$REPO/design-system/_arsiv/$TARIH/$(basename "$(dirname "$(dirname "$HEDEF")")")"; mkdir -p "$AR"
    mv "$HEDEF" "$AR/pluginlabs-design-$(date +%H%M%S)"
  fi
  if [ "${KIP:-copy}" = "symlink" ]; then ln -s "$KANON" "$HEDEF"; else cp -R "$KANON" "$HEDEF"; fi
  log "Skill → $HEDEF (${KIP:-copy})"
done
log "Tamam. AGENTS.md ve CLAUDE.md'ye kurulum/*.parca içeriğini ekleyin."
