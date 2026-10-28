# PluginLabs — Agent development instructions

## Scope and priorities
- Preserve existing behavior and security boundaries of PluginLabs Hub.
- Read README.md, package.json and relevant code/tests before editing.
- Work on a feature branch; do not push directly to main or publish releases without explicit approval.
- Make small, reviewable changes; document risks and test evidence in pull requests.
- Do not add credentials, tokens, private user data, or generated binaries to git.

## Existing stack
- Electron desktop application, Node.js CommonJS, browser extension, local API and provider SDK.
- Node 24 LTS; install locked dependencies with `npm ci`.
- Run `npm test` after code changes.
- Run `npm run test:ui` for renderer, IPC or UI changes; Linux needs Xvfb. UI tests use disposable data. Only CI/test harnesses may disable the Electron sandbox.
- Follow CONTRIBUTING.md, SECURITY.md and docs/DESIGN-SYSTEM.md. Do not treat a policy file as evidence that GitHub settings are enabled.
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
5. Open/update a pull request with summary, validation results, real application screenshots, and rollback considerations. Include screenshots alongside application build outputs; identify the tested commit/platform and any historical images. Link the source Notion task and GitHub issue in both directions.
6. Require human review before merge or release.

## Ecosystem execution agreement
- Before ecosystem work, read docs/ecosystem-v1/WORKING-MODEL.md, ROADMAP.md and WORK-REGISTER.json. Use the existing design-system reference and tokens; do not create a competing palette or redesign the Hub while documenting standards.
- One work item has one owner chat, one branch/workspace and explicit acceptance criteria. Update its evidence and handoff before switching environments. Inspect actual HEAD and dirty state; never discard another chat's work.
- Shared decisions belong in versioned repository documents. Sidebar sections, project membership and chat history do not synchronize files, credentials or instructions across hosts.
- My Mind is the shared AI capability, distinct from the Mind Palace product. Coordinate provider/tool/vision contracts through Master; keep Hub installation, permissions and status in PluginLabs. Do not claim vision, computer use, training or Android/Web support from a text-model connection alone.
- Separate observed facts, historical reports and proposals. Record per-platform passed/failed/not-run evidence with commit, environment and real screenshots. PR descriptions must include real app screenshots, labeling historical images; build delivery must include screenshots, SHA256 and BUILD-INFO.
- Do not open parallel implementation work on the same files without an ownership handoff. Scope changes update the work item and decisions; a blocker records a concrete next step, not an invented success.
- These instructions guide agents; mandatory enforcement must be implemented and verified in CI/branch protection. Never describe this documentation as a deployed gate.
