# NIO prototype

One chat screen that demos NIO. Cost, latency and quality numbers are simulated; the rating and the answer come from a live model.

- Type or pick a prompt. NIO rates it easy, medium or hard, routes it to a worker, and compares tokens, cost and latency against one big model.
- Type `/` to run a test inside the chat: `/burst`, `/surge`, `/crash`, `/node`, `/rollout`, `/policies`.


## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
```

## Live routing

Requests go through the Vite dev server so the key never reaches the browser. Put `OPENROUTER_API_KEY=...` in `.env`, then `npm run dev`.

- `POST /api/classify { prompt }` asks the router model for `{ tier, confidence }`.
- `POST /api/answer { prompt, tier }` streams the answer for that tier.

One model (`nvidia/nemotron-3-ultra-550b-a55b:free`) answers every tier. Each tier is labelled with its own worker in the UI to show the routing, not a different backend.

## Token counter CLI

`tokenizer/` is a separate Bun CLI that counts the real input and output tokens of a query and its response for Claude Opus 5.5, GPT-6.1 Sol, GPT-6 Luna, Kimi K3.1 Pro, DeepSeek V4.1 and GLM-5.3. It needs [Bun](https://bun.sh).

```bash
npm run tokens:install    # once
npm run tokens            # pick a model (or all), paste the query, then the response
npm run tokens:test
npm run tokens:typecheck
```

Finish each multi-line block with a line containing only `.`. See [tokenizer/README.md](tokenizer/README.md) for how each model is counted and how exact the count is.
