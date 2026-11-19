import { Model } from "./src/model";
import { type TokenCounter as Counter, TokenCounter } from "./src/token-counter";

const END = ".";
const lines = console[Symbol.asyncIterator]();

const nextLine = async () => {
  const { value, done } = await lines.next();
  return done ? null : value;
};

/** Reads lines until a line that is just ".", or end of input. */
const readBlock = async (label: string) => {
  console.log(`\n${label} (finish with a line containing only "${END}"):`);
  const block: string[] = [];
  for (let line = await nextLine(); line !== null && line !== END; line = await nextLine()) {
    block.push(line);
  }
  return block.join("\n");
};

const pickModels = async () => {
  console.log("Pick a model:");
  Model.all.forEach((m, i) => console.log(`  ${i + 1}) ${m.name.padEnd(16)} ${m.vendor.padEnd(12)} ${m.weights}`));
  console.log(`  ${Model.all.length + 1}) All of the above`);
  for (;;) {
    process.stdout.write("> ");
    const answer = await nextLine();
    if (answer === null) return null;
    const n = Number(answer.trim());
    if (n === Model.all.length + 1) return Model.all;
    const model = Model.all[n - 1];
    if (Number.isInteger(n) && model) return [model];
    console.log(`"${answer.trim()}" is not a choice. Type a number from 1 to ${Model.all.length + 1}.`);
  }
};

const models = await pickModels();
if (models === null) process.exit(0);

const loaded: { model: (typeof models)[number]; count: Counter }[] = [];
for (const model of models) {
  const counter = await TokenCounter.load(model.tokenizer);
  if (counter.isErr()) console.error(`! ${model.name}: ${counter.error.message}`);
  else loaded.push({ model, count: counter.value });
}
if (loaded.length === 0) process.exit(1);

const query = await readBlock("Query");
for (const { model, count } of loaded) console.log(`  ${model.name}: ${count(query)} input tokens`);

const response = await readBlock("Response");
for (const { model, count } of loaded) console.log(`  ${model.name}: ${count(response)} output tokens`);

console.log("\nResult");
console.table(
  loaded.map(({ model, count }) => {
    const input = count(query);
    const output = count(response);
    return { model: model.name, input, output, total: input + output, accuracy: model.accuracy };
  }),
);
console.log(
  "Counts are raw text tokens. APIs also bill a few chat-template tokens per message,\n" +
    "and reasoning models bill hidden thinking tokens as output on top of the visible response.",
);
