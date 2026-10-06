# NIO — AI Orchestration Comparison Dashboard

Single-page React + Vite + TypeScript product demo UI that visualizes one user query flowing through two execution paths (With NIO vs Without NIO) with measurable differences.

## Tech Stack

- React 18 + Vite + TypeScript (strict)
- Plain CSS with CSS variables + CSS Modules (no Tailwind, no chart library)
- Self-hosted Inter font via `@fontsource/inter`
- No heavy dependencies — only `react`, `react-dom`, `@fontsource/inter`

## Project Structure

```
src/
├── main.tsx                  # App entry point
├── App.tsx                   # Page composition
├── vite-env.d.ts             # Type declarations for CSS modules
├── types.ts                  # Shared TypeScript interfaces
├── data/
│   └── mock.ts               # ← ALL displayed data lives here (typed)
├── styles/
│   ├── tokens.css            # Design tokens (colors, radii, spacing, type)
│   └── global.css            # Reset + page shell
└── components/
    ├── icons/                # Hand-written inline SVG icons
    ├── QualityGauge.tsx      # Circular progress gauge (animated)
    ├── TrendChart.tsx        # Hand-written SVG line chart (animated draw-in)
    ├── FeatureChip.tsx       # RAG / Tools / Guardrails / Cache chips
    ├── MetricList.tsx        # Aligned label/value spec list
    ├── ModelDropdown.tsx     # Accessible select dropdown
    ├── PhoneFrame.tsx        # Reusable phone chrome
    ├── ChatScreen.tsx        # Phone screen content (header/body/input)
    ├── ChatBubble.tsx        # Message bubbles (user/assistant)
    ├── InputBar.tsx          # Capsule input + mic/+/"Tools" row
    ├── SourceChip.tsx        # Grounded-source pills
    ├── FlowConnectors.tsx    # SVG connectors + labels
    ├── PhoneFlow.tsx         # Center → left/right branching layout
    ├── TopHeaderPanel.tsx    # Top panel with gauge + chart
    └── ComparisonCards.tsx   # Side-by-side comparison cards
```

## Commands

```bash
npm install      # install dependencies
npm run dev      # start dev server (Vite + HMR)
npm run build    # type-check + production build
npm run preview  # preview production build
npm run lint     # ESLint
```

## Swapping Mock Data for Real Evaluation Data

**All numbers and text in the UI come from `src/data/mock.ts`.** Replace its exported objects with real evaluation output:

```ts
// src/data/mock.ts

export const baseline = {
  name: "Chat GPT",
  model: "sonnet 4.5",           // your model name
  responseTime: "1.2s",          // measured latency
  score: 455542,                 // your scoring metric
  nio: "—",
  quality: 80,                   // 0–100 quality score
  trend: [850, 150, 70, 70, 110, 230, 230], // 7-day score trend
};

export const withNio: PathMetrics = {
  model: "sonnet 4.5",
  responseTime: "1.1s",
  score: 682410,
  nioStatus: "Enabled",
  quality: 92,
  features: { rag: true, tools: true, guardrails: true, cache: true },
  trend: [830, 310, 250, 180, 310, 520, 600],
  response: [ /* assistant paragraphs */ ],
  sources: ["Scheme Details", "Official Source"],
};

export const withoutNio: PathMetrics = {
  model: "sonnet 4.5",
  responseTime: "1.8s",
  score: 435542,
  nioStatus: "Disabled",
  quality: 76,
  features: { rag: false, tools: false, guardrails: false, cache: false },
  trend: [830, 340, 190, 140, 170, 340, 310],
  response: [ /* assistant paragraphs */ ],
  sources: [],
};
```

All three charts (`TopHeaderPanel`, `NIO card`, `Without NIO card`) share the **same Y scale (0–900)** via the shared `yTicks` / `yMax` constants in `mock.ts` so comparisons stay honest.

**⚠️ The values in `mock.ts` are placeholders. Do not present them as real benchmarks.** The file header reminds you to swap them before publishing.

## Design Tokens

Edit `src/styles/tokens.css` to re-theme the entire dashboard:

```css
:root {
  --bg: #080b10;
  --panel: #0d1219;
  --panel-2: #111821;
  --text: #f5f7fa;
  --text-2: #a8b3c2;
  --text-muted: #687586;
  --border: #263548;
  --border-soft: #1b2735;
  --blue: #159cff;
  --cyan: #16c7ff;
  --green: #20c997;
  --track: #263241;
  /* radii, spacing scale, font stack… */
}
```

Everything uses CSS variables — one file tweaks the whole theme.

## Responsive Behavior

- **Desktop (≥1024px):** Full three-zone layout as designed.
- **Tablet (640–1023px):** Phones scale proportionally; header stacks gauge/chart; cards remain two-column if space allows.
- **Mobile (<640px):** Single-column stack — header → center phone → "with NIO" arrow → NIO phone → "without NIO" arrow → direct phone → NIO card → Without NIO card. No horizontal scrolling at 360px.

## Accessibility

- Semantic HTML (`header`, `main`, `section`, proper heading order)
- `aria-label` on gauges ("Quality 92 percent")
- Charts have `role="img"` + descriptive `aria-label` summaries
- Dropdown has `aria-expanded`, `aria-haspopup`, `role="listbox"`, keyboard navigation
- Visible focus rings (`var(--focus-ring)`)
- WCAG AA contrast on all text
- `prefers-reduced-motion` respected (disables gauge/chart animations and connector pulses)

## License

MIT — demo/UI code only. Mock data is placeholder.