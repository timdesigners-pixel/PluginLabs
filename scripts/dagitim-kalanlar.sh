#!/usr/bin/env bash
# MUST HAVE #7 açığı: Windows sürümü kendi (özel) deposunda yayımlanmış ama Hub'ın indirdiği herkese açık
# pluginlabs-dagitim deposunda olmayan ürünler. 14.11.2026 zamanlanmış denetimde GitHub API'den okundu.
# Bulut oturumu release oluşturamadığı için (politika: 403) yerel `gh` oturumuyla çalıştırın:
#   bash scripts/dagitim-kalanlar.sh
# Her satır scripts/dagitim-yayinla.sh ile dosyayı bayt bayt kopyalar, kaynak digest'iyle doğrular ve
# catalog.cjs için `id= version= size= sha256= url=` satırı yazar. Beklenen SHA-256 değerleri yorumdadır.
set -euo pipefail
cd "$(dirname "$0")"

# musebook v0.1.0: 80978020 bayt, sha256 887a15a173e28086c58a2b2f781e5a5d24e33d722218a97d62a4abbc2a166c3a
./dagitim-yayinla.sh musebook musebook v0.1.0 Musebook-0.1.0-Windows-Portable-x64.exe "Musebook"
# prompt-dunyasi v0.2.0: 81586228 bayt, sha256 489faeb9f115006cf1abd10f4aea4b66862ed734e3acfa659013e759e55ad2f8
./dagitim-yayinla.sh prompt-dunyasi prompt-dunyasi v0.2.0 PromptDunyasi-0.2.0-Windows-Portable-x64.exe "Prompt Dünyası"
# what-the-app v0.1.0: 80954622 bayt, sha256 d7a46fdfe05397f1884aa25f70e9441243d87f904a78373bca1a999640412f3e
./dagitim-yayinla.sh what-the-app what-the-app v0.1.0 WhatTheApp-0.1.0-Windows-Portable-x64.exe "What the App!"
# whatsapp-chat-viewer v0.1.0: 80941776 bayt, sha256 2427f358d0b85e6ff3aa5bb6508927965e3193df493c542835cab7df2120ddae
./dagitim-yayinla.sh whatsapp-chat-viewer whatsapp-chat-viewer v0.1.0 WhatsAppChatViewer-0.1.0-Windows-Portable-x64.exe "WhatsApp Chat Viewer"
# dilekce-olustur v0.1.0: 80932650 bayt, sha256 3cf0c007210a6f116259707bbd1406f958ad5657558d37a1e2ac8fd955834b7d
./dagitim-yayinla.sh dilekce-olustur dilekce-olustur v0.1.0 DilekceOlustur-0.1.0-Windows-Portable-x64.exe "Dilekçe Oluştur"
# gadget-dunyasi-companion v0.1.0: 80928573 bayt, sha256 5a15d81319994adf0ddeac76e72af09b5e61daa8ed0bd64ea8c3eff3d90b2a3d
./dagitim-yayinla.sh gadget-dunyasi-companion gadget-dunyasi-companion v0.1.0 GadgetDunyasiCompanion-0.1.0-Windows-Portable-x64.exe "Gadget Dünyası Companion"
# social-saves-organizer v0.1.0: 80949407 bayt, sha256 a659993948b14ee6f2431a53c5f1242ccf4ef9ebc66986ede863c7143f6678a1
./dagitim-yayinla.sh social-saves-organizer social-saves-organizer v0.1.0 SocialSavesOrganizer-0.1.0-Windows-Portable-x64.exe "Social Saves Organizer"
# youtube-shelf v0.1.1: 80941119 bayt, sha256 b029718f3dc7140c10a1110fa5bcc1cf06d71f9a17a9314a9ae1fdc95de02be3
./dagitim-yayinla.sh youtube-shelf youtube-shelf v0.1.1 YouTubeShelf-0.1.1-Windows-Portable-x64.exe "YouTube Shelf"
# tab-atlas v0.1.0: 80956181 bayt, sha256 2236657af62303e0c1bf9227b069f9cf613ef0a85b9c45dd43b3fc132e58bd6a
./dagitim-yayinla.sh tab-atlas tab-atlas v0.1.0 TabAtlas-0.1.0-Windows-Portable-x64.exe "Tab Atlas"
# page-capsule v0.1.0: 80959390 bayt, sha256 41ae2fc1cdabc4677b27531e341b06b9d5e4af5edc93bb5805abedc23e2a44cb
./dagitim-yayinla.sh page-capsule page-capsule v0.1.0 PageCapsule-0.1.0-Windows-Portable-x64.exe "Page Capsule"
# form-flow v0.1.0: 80967413 bayt, sha256 5a0db43755575fc5b10482aa5d5a28fc6de1f971a62e92bb001bb50294d0b9bd
./dagitim-yayinla.sh form-flow form-flow v0.1.0 FormFlow-0.1.0-Windows-Portable-x64.exe "Form Flow"
# compare-lens v0.1.0: 80956333 bayt, sha256 f2c89f8a7f8ed1929bf701fc7360b70b4ec30f935731a39f131ed882af558caf
./dagitim-yayinla.sh compare-lens compare-lens v0.1.0 CompareLens-0.1.0-Windows-Portable-x64.exe "Compare Lens"
# page-change-radar v0.1.0: 80987219 bayt, sha256 4f055770c43dd4c0f4cb7829bf91653d6a9b77cec5171c0440dbeb99c0ac21d8
./dagitim-yayinla.sh page-change-radar page-change-radar v0.1.0 PageChangeRadar-0.1.0-Windows-Portable-x64.exe "Page Change Radar"
# desk-tidy v0.1.0: 80943028 bayt, sha256 e78353671d70bd7b398b3e4c8701a297b7e0f3abd83970c0238585f6b9a12f40
./dagitim-yayinla.sh desk-tidy desk-tidy v0.1.0 DeskTidy-0.1.0-Windows-Portable-x64.exe "Desk Tidy"
# twin-finder v0.1.0: 80937977 bayt, sha256 9de6baa5001a02b02dc0ca30c7d486f53533f78f107ae1242711003a5dff0c26
./dagitim-yayinla.sh twin-finder twin-finder v0.1.0 TwinFinder-0.1.0-Windows-Portable-x64.exe "Twin Finder"
# clip-vault v0.1.0: 80947542 bayt, sha256 22a068592755ccdb4d387bbfd7b01fb9d1ccf59c6bdf8c46435d2654dc3718e7
./dagitim-yayinla.sh clip-vault clip-vault v0.1.0 ClipVault-0.1.0-Windows-Portable-x64.exe "Clip Vault"
# snap-ocr v0.1.0: 100286428 bayt, sha256 1c3124657add1aac8def8914ff31f294794a82f8db9cae64a45dda3445d3d7fe
./dagitim-yayinla.sh snap-ocr snap-ocr v0.1.0 SnapOCR-0.1.0-Windows-Portable-x64.exe "Snap OCR"
# extension-manager v1.1.0: 80956383 bayt, sha256 4a69d624c81cc7544ba53d2628d6a36714fd03fc15f879b5c3f5d2d98394a17d
./dagitim-yayinla.sh extension-manager extension-manager v1.1.0 EklentiYoneticisi-1.1.0-Windows-Portable-x64.exe "Eklenti Yöneticisi"
# tweakster v0.1.0: 80959189 bayt, sha256 005b6d348d94ad1e75466c790418dfede2887c1100722460d7df9fb0448279ea
./dagitim-yayinla.sh tweakster tweakster v0.1.0 Tweakster-0.1.0-Windows-Portable-x64.exe "Tweakster"
