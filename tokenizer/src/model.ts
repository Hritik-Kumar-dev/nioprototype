/** Where a model's tokenizer comes from. Each kind is loaded differently. */
export type TokenizerSource =
  /** Anthropic's Opus 5 family tokenizer, ported offline (vendor/ai-tokenizer). */
  | { kind: "claude_v5" }
  /** OpenAI tiktoken BPE encoding. */
  | { kind: "tiktoken"; encoding: "o200k_base" }
  /** A Hugging Face `tokenizer.json` (plus `tokenizer_config.json`) in a Hub repo. */
  | { kind: "huggingface"; repo: string };

export type Model = {
  name: string;
  vendor: string;
  weights: "Closed" | "Open weights";
  tokenizer: TokenizerSource;
  /** How exact the count is, shown next to the result. */
  accuracy: string;
};

export const Model = {
  all: [
    {
      name: "Claude Opus 5.5",
      vendor: "Anthropic",
      weights: "Closed",
      tokenizer: { kind: "claude_v5" },
      accuracy: "offline port; matches /v1/messages/count_tokens content count",
    },
    {
      name: "GPT-6.1 Sol",
      vendor: "OpenAI",
      weights: "Closed",
      tokenizer: { kind: "tiktoken", encoding: "o200k_base" },
      accuracy: "o200k_base assumed; OpenAI has not published GPT-6 tokenizer",
    },
    {
      name: "GPT-6 Luna",
      vendor: "OpenAI",
      weights: "Closed",
      tokenizer: { kind: "tiktoken", encoding: "o200k_base" },
      accuracy: "o200k_base assumed; OpenAI has not published GPT-6 tokenizer",
    },
    {
      name: "Kimi K3.1 Pro",
      vendor: "Moonshot AI",
      weights: "Open weights",
      // K3.1 Pro ships the same tiktoken.model as K3 (identical sha256), so the
      // K3 tokenizer.json conversion is exact for it.
      tokenizer: { kind: "huggingface", repo: "Xenova/Kimi-K3-tokenizer" },
      accuracy: "exact (official vocab)",
    },
    {
      name: "DeepSeek V4.1",
      vendor: "DeepSeek",
      weights: "Open weights",
      // Only the Flash checkpoint of V4.1 is public; the V4 family shares one vocabulary.
      tokenizer: { kind: "huggingface", repo: "deepseek-ai/DeepSeek-V4.1-Flash" },
      accuracy: "exact (official tokenizer.json)",
    },
    {
      name: "GLM-5.3",
      vendor: "Z.ai",
      weights: "Open weights",
      tokenizer: { kind: "huggingface", repo: "zai-org/GLM-5.3" },
      accuracy: "exact (official tokenizer.json)",
    },
  ] as const satisfies readonly Model[],
} as const;
