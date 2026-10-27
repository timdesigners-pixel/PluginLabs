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
