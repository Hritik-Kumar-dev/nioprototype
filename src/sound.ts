import { bind, play, setVolume, type PlayOptions, type SoundName } from "cuelume";

let started = false;

/** Wire up `data-cuelume-*` attributes once. Safe to call more than once. */
export function startSound() {
  if (started) return;
  started = true;
  setVolume(1);
  bind();
}

export const sound = {
  play: (name: SoundName, options?: PlayOptions) => play(name, options),
};
