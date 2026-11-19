# Token counter CLI

Interactive Bun CLI that counts the real tokens a query costs as input, and the tokens a response costs as output, for each model NIO talks about.

```bash
npm run tokens:install   # from the repo root; installs this folder's dependencies
npm run tokens           # pick a model (or all), paste the query, then the response
npm run tokens:test
npm run tokens:typecheck
```

Or run it directly from this folder:

```bash
bun install
bun run start
```

Pick a model by number, or pick `7` to count every model at once. Then paste the query, finish with a line containing only `.`, paste the response, and finish the same way. The final table shows input, output and total tokens per model, plus how the count was obtained.

## How the counts are computed

Each model maps to a tokenizer source in `src/model.ts`, and `src/token-counter.ts` loads that source:

| Model          | Vendor     | Weights      | Tokenizer                                | Accuracy                                                    |
| -------------- | ---------- | ------------ | ---------------------------------------- | ----------------------------------------------------------- |
| Claude Opus 5.5 | Anthropic | Closed       | Anthropic Opus 5 codec, vendored offline | Matches `/v1/messages/count_tokens` content count            |
| GPT-6.1 Sol    | OpenAI     | Closed       | `o200k_base` tiktoken BPE                | Assumed; OpenAI has not published a GPT-6 tokenizer          |
| GPT-6 Luna     | OpenAI     | Closed       | `o200k_base` tiktoken BPE                | Assumed; OpenAI has not published a GPT-6 tokenizer          |
| Kimi K3.1 Pro  | Moonshot AI | Open weights | Official `tokenizer.json` from the Hub    | Exact                                                        |
| DeepSeek V4.1  | DeepSeek   | Open weights | Official `tokenizer.json` from the Hub    | Exact                                                        |
| GLM-5.3        | Z.ai       | Open weights | Official `tokenizer.json` from the Hub    | Exact                                                        |

- **Claude Opus 5.5** uses a vendored port of Anthropic's tokenizer in `vendor/ai-tokenizer/`, so it needs no network access.
- **GPT-6.1 Sol / GPT-6 Luna** use OpenAI's public `o200k_base` BPE encoding through `ai-tokenizer`. It is the closest published encoding, not a confirmed GPT-6 tokenizer, so treat those numbers as estimates.
- **Kimi K3.1 Pro, DeepSeek V4.1, GLM-5.3** download the model's own `tokenizer.json` and `tokenizer_config.json` from Hugging Face on first use and cache them in `.cache/tokenizers/`. Later runs are offline. Encoding runs with `add_special_tokens: false`, so counts are raw text only.

## What the numbers do not include

These are raw text token counts. A real API call also bills a small chat-template overhead per message (role markers, separators), and reasoning models bill hidden thinking tokens as output on top of the visible response. For exact provider-side numbers, use the provider's own counting endpoint (for example Anthropic's `/v1/messages/count_tokens`).

## Layout

```
index.ts               interactive prompt and result table
src/model.ts           the model list and each model's tokenizer source
src/token-counter.ts   loading and counting for every tokenizer kind
test/                  Bun tests, with a recorded Claude count fixture
vendor/ai-tokenizer/   offline Claude Opus 5 tokenizer port
```
