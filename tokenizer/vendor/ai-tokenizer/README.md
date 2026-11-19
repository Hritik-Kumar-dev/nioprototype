Vendored from https://github.com/coder/ai-tokenizer at commit 6dec619 (MIT, see LICENSE).

The `claude_v5` encoding (Claude Opus 5 / 5.5) is not in the npm release (1.0.7) yet.
Only the files it needs are copied, unchanged except `tokenizer.ts`, which keeps just the `Codec` type.
Replace with the npm package once a release ships `ai-tokenizer/encoding/claude_v5`.
