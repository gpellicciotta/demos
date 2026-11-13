# Browser Whisper Fallback Validation

## Test Plan
- Unit: Cover missing GPU API, null adapters, rejected adapter requests, GPU initialization failures, and WASM failures.
- Integration: Check pipeline caching integration and parse the complete application script.
- Browser: Live model download and audio transcription remain unverified.
- Scope: Preserve existing uncommitted demo changes; add fallback logic and regression checks.
- Harness: Use Node's built-in runner without adding dependencies to this standalone HTML demo.

## Walkthrough & Validation
Red phase: `node --test tests/browser-whisper.test.mjs`, exit code 1.

```text
# tests 7
# suites 0
# pass 0
# fail 7
# cancelled 0
# skipped 0
# todo 0
# duration_ms 539.771
```

The failing cases reported: `Whisper must initialize through an adapter-aware fallback helper`.

Green phase: `node --test tests/browser-whisper.test.mjs | Select-Object -Last 10`, exit code 0.

```text
  ...
1..8
# tests 8
# suites 0
# pass 8
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 329.6166
```

`lint-markdown check CHANGELOG.md .plan/tasks/T0004-fix-browser-whisper-fallback/validation-proof.md`, exit code 0.

```text
All 2 markdown files passed linting.
```
