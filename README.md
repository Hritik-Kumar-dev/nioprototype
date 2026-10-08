# NIO prototype

One chat screen that demos NIO with simulated data. No real models are called.

- Type or pick a prompt. NIO rates it easy, medium or hard, routes it to a worker, and compares tokens, cost and latency against one big model.
- Type `/` to run a test inside the chat: `/burst`, `/surge`, `/crash`, `/node`, `/rollout`, `/policies`.
- Interaction sounds come from [cuelume](https://cuelume-site.pages.dev/agents.md). Sound is always on. The header has a light/dark theme toggle.

Simulation code lives in `src/sim` and is covered by `npm test`.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
```
