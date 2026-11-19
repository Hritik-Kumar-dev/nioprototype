import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Tokenizer as HfTokenizer } from "@huggingface/tokenizers";
import { Tokenizer as BpeTokenizer } from "ai-tokenizer";
import * as o200k_base from "ai-tokenizer/encoding/o200k_base";
import { Result, TaggedError } from "better-result";
import * as claude_v5 from "../vendor/ai-tokenizer/encoding/claude_v5";
import type { TokenizerSource } from "./model";

/** Counts the tokens a text costs, without chat-template or BOS/EOS tokens. */
export type TokenCounter = (text: string) => number;

export class TokenizerLoadError extends TaggedError("TokenizerLoadError")<{
  repo: string;
  file: string;
  message: string;
  cause: unknown;
}> {}

const CACHE_DIR = join(import.meta.dir, "..", ".cache", "tokenizers");

/** Reads a Hub file from the local cache, downloading it on first use. */
const hubJson = (repo: string, file: string) =>
  Result.tryPromise({
    try: async () => {
      const path = join(CACHE_DIR, repo, file);
      const cached = Bun.file(path);
      let body: string;
      if (await cached.exists()) {
        body = await cached.text();
      } else {
        const res = await fetch(`https://huggingface.co/${repo}/resolve/main/${file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        body = await res.text();
      }
      const value: unknown = JSON.parse(body);
      if (typeof value !== "object" || value === null) throw new Error("not a JSON object");
      if (!(await cached.exists())) {
        await mkdir(join(CACHE_DIR, repo), { recursive: true });
        await Bun.write(path, body);
      }
      return value;
    },
    catch: (cause) =>
      new TokenizerLoadError({
        repo,
        file,
        cause,
        message:
          `Could not load ${file} for ${repo} from huggingface.co: ${String(cause)}. ` +
          `Other models still work. Check your network and run again; ` +
          `files that did download are cached in .cache/tokenizers.`,
      }),
  });

export const TokenCounter = {
  load: async (source: TokenizerSource): Promise<Result<TokenCounter, TokenizerLoadError>> => {
    switch (source.kind) {
      case "claude_v5":
        return Result.ok((text) => claude_v5.codec.encode(text).length);
      case "tiktoken": {
        const tokenizer = new BpeTokenizer(o200k_base);
        return Result.ok((text) => tokenizer.count(text));
      }
      case "huggingface": {
        const json = await hubJson(source.repo, "tokenizer.json");
        if (json.isErr()) return Result.err(json.error);
        const config = await hubJson(source.repo, "tokenizer_config.json");
        if (config.isErr()) return Result.err(config.error);
        const tokenizer = new HfTokenizer(json.value, config.value);
        return Result.ok(
          (text) => tokenizer.encode(text, { add_special_tokens: false }).ids.length,
        );
      }
    }
  },
} as const;
