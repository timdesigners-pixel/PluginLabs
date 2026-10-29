# PluginLabs — Agent development instructions

## Scope and priorities
- Preserve existing behavior and security boundaries of PluginLabs Hub.
- Read README.md, package.json and relevant code/tests before editing.
- Work on a feature branch; do not push directly to main or publish releases without explicit approval.
- Make small, reviewable changes; document risks and test evidence in pull requests.
- Do not add credentials, tokens, private user data, or generated binaries to git.

## Existing stack
- Electron desktop application, Node.js CommonJS, browser extension, local API and provider SDK.
- Node 20.18+; install dependencies with `npm ci`.
- Run `npm test` after code changes.
- Windows build: `npm run build:win`; Linux AppImage: `npm run build:linux`.
- Do not assume an Android build exists. Propose separate architecture before adding Android support.

## Design language
- Dark theme by default, with a consistent visual system across PluginLabs applications.
- Use the existing PluginLabs Windows app as the visual reference, especially typography, menu spacing, layout and restrained gradients.
- Aim for ChatGPT desktop-like readability and form ergonomics without copying proprietary assets.
- Keep animations subtle and purposeful; support reduced-motion preferences.
- Favor reusable components, accessible contrast, keyboard navigation and clear focus indicators.

## Security and architecture
- Preserve loopback-only API binding, permission checks, token handling, and explicit user approvals.
- Never expose API tokens in frontend scripts or logs.
- Validate downloaded packages, hashes, size limits and archive extraction boundaries.
- Avoid breaking compatibility with existing installed resources, provider adapters and extensions.

## Change workflow
1. Summarize requirements and acceptance criteria.
2. Inspect implementation and identify affected tests.
3. Implement minimal changes on a separate branch.
4. Run tests and relevant build checks; state what was not executed.
5. Open a pull request with summary, validation results, screenshots for UI changes, and rollback considerations.
6. Require human review before merge or release.

## PluginLabs Tasarım Sistemi (Codex)

- Herhangi bir UI/stil işinde önce `.agents/skills/pluginlabs-design/SKILL.md` dosyasını oku ve uygula.
- Ortak kaynak: Claude Code aynı skill'i `.claude/skills/pluginlabs-design/` altından okur. İki kopya **aynıdır**; değişiklik yalnız `design-system/pluginlabs-design/` (kanonik) klasöründe yapılır ve `kurulum/kur.sh` ile eşitlenir.
- Mevcut tasarıma dokunma: yalnız `[data-pl]` kapsayıcısı, `--pl-` tokenları ve `pl-` sınıfları.
- Görev sonunda 📌 GÖREV / ✅ DURUM / 📁 ÇIKTI / ⚠️ NOTLAR / 🔜 SONRAKİ ADIM formatında raporla.
- Uygulama paletleri: `hub-yesil` (varsayılan, mevcut Windows Hub) ve `iris`; modlar `koyu` (varsayılan) ve `acik`. Seçim Ayarlar → Görünüm'den yapılır; tokenlar `ui/styles.css` + `ui/themes.css` içindedir (`node scripts/generate-themes.cjs` ile yeniden üretilir). Palet çelişkisinde `AGENTS.md` üstteki "Design language" bölümü ve mevcut Hub varsayılanı geçerlidir.
