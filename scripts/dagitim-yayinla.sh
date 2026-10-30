#!/usr/bin/env bash
# MUST HAVE (MH-7): bir uygulama sürümünü herkese açık dağıtım deposuna bayt bayt aynı kopyalar ve doğrular.
# Kullanım: scripts/dagitim-yayinla.sh <katalog-id> <kaynak-depo> <etiket> <dosya-adı> "<Görünen ad>"
# Örnek:   scripts/dagitim-yayinla.sh finansal-asistan finansal-asistan v0.1.0 FinansalAsistan-0.1.0-Windows-Portable-x64.exe "Finansal Asistan"
# Gereken: kaynak depoyu okuyabilen ve pluginlabs-dagitim'e yazabilen gh oturumu (ya da GH_TOKEN). Çıktı: boyut ve SHA-256 (catalog.cjs için).
set -euo pipefail
id=$1 src=$2 tag=$3 file=$4 name=$5
owner=timdesigners-pixel dist=$owner/pluginlabs-dagitim ver=${tag#v} dtag="$id-v${tag#v}"
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
gh release download "$tag" -R "$owner/$src" -p "$file" -D "$work"
got=$(sha256sum "$work/$file" | cut -c1-64)
want=$(gh release view "$tag" -R "$owner/$src" --json assets -q ".assets[]|select(.name==\"$file\")|.digest" | sed 's/^sha256://')
[ -z "$want" ] || [ "$want" = "$got" ] || { echo "SHA-256 kaynakla uyuşmuyor: $got / $want" >&2; exit 1; }
(cd "$work" && sha256sum "$file" > SHA256SUMS.txt)
if gh release view "$dtag" -R "$dist" >/dev/null 2>&1; then
  gh release upload "$dtag" "$work/$file" "$work/SHA256SUMS.txt" -R "$dist" --clobber
else
  gh release create "$dtag" "$work/$file" "$work/SHA256SUMS.txt" -R "$dist" --title "$name $ver" \
    --notes "Kaynak: https://github.com/$owner/$src/releases/tag/$tag (özel depo). Dosya kaynak sürümle bayt bayt aynıdır. SHA-256: $got. İmzasız."
fi
url="https://github.com/$dist/releases/download/$dtag/$file"
for i in 1 2 3 4 5 6 7 8 9 10; do
  pub=$(curl -sL "$url" | sha256sum | cut -c1-64)
  [ "$pub" = "$got" ] && break; sleep 15
done
[ "$pub" = "$got" ] || { echo "Herkese açık indirme doğrulanamadı: $url" >&2; exit 1; }
echo "id=$id version=$ver size=$(stat -c %s "$work/$file") sha256=$got url=$url"
