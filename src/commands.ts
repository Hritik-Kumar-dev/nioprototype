export type RunKind = "burst" | "surge" | "crash" | "node" | "rollout" | "policies";

export type Command = { id: RunKind; trigger: string; hint: string };

export const COMMANDS: readonly Command[] = [
  { id: "burst", trigger: "/burst", hint: "5x traffic for 20 seconds" },
  { id: "surge", trigger: "/surge", hint: "traffic climbs to 4x and stays" },
  { id: "crash", trigger: "/crash", hint: "kill one worker pod" },
  { id: "node", trigger: "/node", hint: "take a whole node offline" },
  { id: "rollout", trigger: "/rollout", hint: "rolling update, pod by pod" },
  { id: "policies", trigger: "/policies", hint: "compare five schedulers" },
];

export function findCommand(text: string) {
  const word = text.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return COMMANDS.find((c) => c.trigger === word);
}
