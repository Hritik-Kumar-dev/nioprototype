/** Trimmed from ai-tokenizer's src/tokenizer.ts: only the type the Claude codec needs. */
export interface Codec {
  encode(text: string): number[];
  decode(tokens: number[]): string;
}
